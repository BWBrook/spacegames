import type { GameFactory } from '../types';
import { STARSHIP_CONSTANTS } from './constants';
import { stepEvents } from './events';
import {
  computeBaseThrust,
  computeOptimality,
  createStarshipState,
  refreshTelemetry,
  resetForRetry,
  transitionPhase,
} from './state';
import type { StarshipState, Particle } from './types';
import { audioCues, type AudioCueId } from '../../assets/audio';

interface PointerState {
  active: boolean;
  mode: null | 'base-thrust' | 'vector' | 'fuel' | 'throttle';
  x: number;
  y: number;
}

interface StarSprite {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export const createGame: GameFactory = ({ stage, input, manifest: entry, audio }) => {
  const state = createStarshipState();
  const pointer: PointerState = { active: false, mode: null, x: 0, y: 0 };
  const stars: StarSprite[] = createStars(stage.width, stage.height);
  const audioBuffers = new Map<AudioCueId, AudioBuffer>();
  const activeEventAudio = new Set<string>();
  let ambientSource: AudioBufferSourceNode | null = null;
  let warningCooldown = 0;
  let ventTimer = 0;

  const canvas = stage.canvas;

  const pointerDown = (event: PointerEvent) => {
    const coords = toStageCoords(event, stage);
    pointer.active = true;
    pointer.x = coords.x;
    pointer.y = coords.y;
    pointer.mode = resolvePointerMode(coords.x, coords.y, stage, state.phase);
    updatePointerControl(pointer, state, stage);
    canvas.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: PointerEvent) => {
    if (!pointer.active) return;
    const coords = toStageCoords(event, stage);
    pointer.x = coords.x;
    pointer.y = coords.y;
    updatePointerControl(pointer, state, stage);
  };

  const pointerUp = (event: PointerEvent) => {
    pointer.active = false;
    pointer.mode = null;
    canvas.releasePointerCapture(event.pointerId);
  };

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointerleave', pointerUp);

  async function loadCue(id: AudioCueId) {
    const buffer = audioBuffers.get(id);
    if (buffer) return buffer;
    try {
      await audio.unlock();
      const loaded = await audio.load(audioCues[id]);
      audioBuffers.set(id, loaded);
      return loaded;
    } catch (err) {
      console.warn(`Failed to load audio cue ${id}`, err);
      return null;
    }
  }

  async function ensureAmbientLoop() {
    if (ambientSource) return;
    const buffer = await loadCue('starship/prep-ambience');
    if (!buffer || !audio.ctx) return;
    stopAmbientLoop();
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = audio.ctx.createGain();
    gain.gain.value = 0.22;
    source.connect(gain).connect(audio.ctx.destination);
    source.start();
    ambientSource = source;
  }

  function stopAmbientLoop() {
    if (ambientSource) {
      try {
        ambientSource.stop();
      } catch {
        /* already stopped */
      }
      ambientSource.disconnect();
    }
    ambientSource = null;
  }

  function playCue(id: AudioCueId, gain = 0.5) {
    loadCue(id).then(buffer => {
      if (!buffer) return;
      try {
        audio.play(buffer, 0, gain);
      } catch (err) {
        console.warn('Audio playback failed', err);
      }
    });
  }

  function triggerWarning(force = false) {
    if (!force && warningCooldown > 0) return;
    warningCooldown = 1.2;
    playCue('starship/warning', 0.45);
  }

  function handleEventAudio(current: StarshipState) {
    for (const evt of current.ascent.events) {
      if (evt.status === 'active' && !activeEventAudio.has(evt.id)) {
        activeEventAudio.add(evt.id);
        triggerWarning(true);
      } else if (evt.status === 'resolved' && activeEventAudio.has(evt.id)) {
        activeEventAudio.delete(evt.id);
      }
    }
  }

  const updatePrep = (
    starship: StarshipState,
    controls: { isDown(key: string): boolean; consumePress(key: string): boolean },
    dt: number,
  ) => {
    const adjustment = starship.config.thrustAdjustmentPerSecond * dt;
    if (controls.isDown('ArrowLeft') || controls.isDown('a')) starship.controls.baseThrust = clamp01(starship.controls.baseThrust - adjustment);
    if (controls.isDown('ArrowRight') || controls.isDown('d')) starship.controls.baseThrust = clamp01(starship.controls.baseThrust + adjustment);
    if (controls.isDown('ArrowUp') || controls.isDown('w')) starship.controls.vectorBias = clampSigned(starship.controls.vectorBias + adjustment * 0.5);
    if (controls.isDown('ArrowDown') || controls.isDown('s')) starship.controls.vectorBias = clampSigned(starship.controls.vectorBias - adjustment * 0.5);
    if (controls.isDown('q')) starship.controls.fuelMix = clampSigned(starship.controls.fuelMix - adjustment * 0.8);
    if (controls.isDown('e')) starship.controls.fuelMix = clampSigned(starship.controls.fuelMix + adjustment * 0.8);

    if (starship.phaseElapsed >= starship.config.prepDuration || controls.consumePress('Enter')) {
      starship.statusMessage = 'Hit Enter with the cursor centered to capture the ignition window.';
      transitionPhase(starship, 'commit');
    }
  };

  const updateCommit = (
    starship: StarshipState,
    controls: { consumePress(key: string): boolean },
    dt: number,
  ) => {
    const speed = starship.config.commitCursorSpeed;
    starship.commit.cursor += starship.commit.direction * speed * dt;
    if (starship.commit.cursor >= 1) {
      starship.commit.cursor = 1;
      starship.commit.direction = -1;
    }
    if (starship.commit.cursor <= 0) {
      starship.commit.cursor = 0;
      starship.commit.direction = 1;
    }

    if (controls.consumePress('Enter') || controls.consumePress(' ')) {
      const delta = Math.abs(starship.commit.cursor - 0.5);
      starship.commit.score = Math.max(0, 1 - delta * 2);
      starship.commit.resolved = true;
      starship.statusMessage = 'Engines ignited—ride the burn and manage heat!';
      playCue('starship/ignition', 0.75);
      transitionPhase(starship, 'ascent');
      starship.phaseElapsed = 0;
      return;
    }

    if (starship.phaseElapsed >= starship.config.commitWindow) {
      starship.commit.score = Math.max(0.2, 1 - Math.abs(starship.commit.cursor - 0.5));
      starship.commit.resolved = true;
      starship.statusMessage = 'Autosequencer forced ignition—ride carefully!';
      playCue('starship/ignition', 0.65);
      transitionPhase(starship, 'ascent');
      starship.phaseElapsed = 0;
    }
  };

  const updateAscent = (starship: StarshipState, controls: { isDown(key: string): boolean }, dt: number) => {
    const activeEvent = starship.ascent.events.some(evt => evt.status === 'active');
    const thrustAdjust = starship.config.thrustAdjustmentPerSecond * dt * 1.6;
    if (controls.isDown('ArrowUp') || controls.isDown('w')) starship.ascent.thrust = clamp01(starship.ascent.thrust + thrustAdjust);
    if (controls.isDown('ArrowDown') || controls.isDown('s')) starship.ascent.thrust = clamp01(starship.ascent.thrust - thrustAdjust);

    const venting = controls.isDown(' ') || controls.isDown('Shift');

    const baseThrust = computeBaseThrust(starship);
    const commitBonus = 0.92 + starship.commit.score * 0.16;
    const liveMod = 0.86 + starship.ascent.thrust * 0.28;
    const vectorPenalty = 1 - Math.abs(starship.controls.vectorBias) * 0.08;
    const fuelBonus = 1 + starship.controls.fuelMix * 0.05;
    const actualThrust = baseThrust * commitBonus * liveMod * vectorPenalty * fuelBonus;
    starship.ascent.lastThrust = actualThrust;

    const burnAccuracy = computeOptimality(starship, actualThrust);
    const underburn = Math.max(0, (starship.optimalForce - actualThrust) / Math.max(1, starship.optimalForce));
    const overburn = Math.max(0, (actualThrust - starship.optimalForce) / Math.max(1, starship.optimalForce));
    const acceleration = 6 + burnAccuracy * 28 - underburn * 18 - overburn * 8;
    starship.ascent.velocity = Math.max(0, starship.ascent.velocity + acceleration * dt);
    starship.ascent.altitude += starship.ascent.velocity * dt;

    const [, maxBaseThrust] = starship.config.baseThrustRange;
    const heatGain = (Math.max(0, actualThrust) / maxBaseThrust) * starship.config.heatRisePerThrust * dt;
    const heatLoss = (starship.config.heatCoolRate + (venting ? starship.config.heatVentRate : 0)) * dt;
    starship.ascent.heat += heatGain - heatLoss;
    starship.ascent.heat = Math.max(0, starship.ascent.heat);
    starship.ascent.peakHeat = Math.max(starship.ascent.peakHeat, starship.ascent.heat);
    starship.ascent.burnIntegral += actualThrust * dt;
    starship.ascent.burnTime += dt;

    if (venting) {
      starship.statusMessage = 'Venting heat; climb efficiency reduced.';
      starship.ascent.velocity -= 15 * dt;
      if (ventTimer <= 0) {
        playCue('starship/vent', 0.55);
        ventTimer = 1.25;
      }
    } else if (!activeEvent) {
      starship.statusMessage = 'Balance thrust vs. heat; watch hull integrity.';
    }

    if (starship.ascent.heat > 120) {
      starship.ascent.integrity = Math.max(0, starship.ascent.integrity - starship.config.integrityDecayPerHit * dt);
      triggerWarning();
    }

    if (starship.ascent.altitude < 0) {
      starship.ascent.altitude = 0;
      starship.ascent.velocity = Math.max(0, starship.ascent.velocity);
    }

    stepEvents(starship, starship.phaseElapsed);
    handleEventAudio(starship);

    spawnExhaust(starship, dt, stage);
    maybeSpawnDebris(starship, dt, stage);

    const success = starship.ascent.altitude >= starship.ascent.targetAltitude;
    const failure = starship.ascent.integrity <= 0 || starship.ascent.heat >= 140;

    if (success || failure) {
      const meanBurn = starship.ascent.burnTime > 0
        ? starship.ascent.burnIntegral / starship.ascent.burnTime
        : actualThrust;
      const accuracy = computeOptimality(starship, meanBurn);
      starship.debrief = {
        outcome: success ? 'success' : 'failure',
        accuracy,
        summary: success ? successSummary(accuracy) : failureSummary(starship),
        rewards: Math.round(accuracy * 240),
      };
      starship.statusMessage = success
        ? 'Orbit secured. Review the burn profile and prep another launch.'
        : 'Mission aborted. Review the telemetry and try a new ascent plan.';
      playCue(success ? 'starship/success' : 'starship/failure', success ? 0.65 : 0.55);
      transitionPhase(starship, 'debrief');
      stopAmbientLoop();
    }
  };

  const updateDebrief = (
    starship: StarshipState,
    controls: { consumePress(key: string): boolean },
    _dt: number,
  ) => {
    if (starship.phaseElapsed < 1) return;
    if (controls.consumePress('Enter') || controls.consumePress(' ')) {
      resetForRetry(starship);
      ensureAmbientLoop();
    }
  };

  const game = {
    enter() {
      transitionPhase(state, 'prep');
      ensureAmbientLoop();
    },
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      warningCooldown = Math.max(0, warningCooldown - dt);
      ventTimer = Math.max(0, ventTimer - dt);
      refreshTelemetry(state, dt);
      updateStars(stars, dt, stage);
      switch (state.phase) {
        case 'prep':
          updatePrep(state, input, dt);
          break;
        case 'commit':
          updateCommit(state, input, dt);
          break;
        case 'ascent':
          updateAscent(state, input, dt);
          break;
        case 'debrief':
          updateDebrief(state, input, dt);
          break;
      }
      updateParticles(state.exhaust, dt);
      updateParticles(state.debris, dt);
    },
    render() {
      const g = stage.ctx;
      drawBackdrop(g, stage.width, stage.height, stars);
      switch (state.phase) {
        case 'prep':
          renderPrep(g, stage, state, pointer);
          break;
        case 'commit':
          renderCommit(g, stage, state);
          break;
        case 'ascent':
          renderAscent(g, stage, state);
          break;
        case 'debrief':
          renderDebrief(g, stage, state);
          break;
      }
      renderStatusBar(g, stage, state, entry.title);
    },
    debugSnapshot() {
      return {
        gameId: entry.id,
        phase: state.phase,
        status: state.statusMessage,
        telemetry: {
          gravity: Number(state.telemetry.displayGravity.toFixed(2)),
          wind: Number(state.telemetry.displayWind.toFixed(2)),
          noise: Number(state.telemetry.noise.toFixed(2)),
          estimatedTarget: Math.round(getTelemetryTarget(state)),
        },
        controls: {
          baseThrust: Number(state.controls.baseThrust.toFixed(3)),
          vectorBias: Number(state.controls.vectorBias.toFixed(3)),
          fuelMix: Number(state.controls.fuelMix.toFixed(3)),
        },
        commit: {
          cursor: Number(state.commit.cursor.toFixed(3)),
          score: Number(state.commit.score.toFixed(3)),
        },
        ascent: {
          altitude: Math.round(state.ascent.altitude),
          targetAltitude: state.ascent.targetAltitude,
          velocity: Math.round(state.ascent.velocity),
          heat: Number(state.ascent.heat.toFixed(1)),
          integrity: Number(state.ascent.integrity.toFixed(1)),
          thrust: Number(state.ascent.thrust.toFixed(3)),
          currentBurn: Math.round(state.ascent.lastThrust),
          averageBurn: Math.round(getAverageBurn(state)),
        },
        activeEvent: getActiveEvent(state)?.title ?? null,
        nextEvent: getNextEvent(state)
          ? {
              title: getNextEvent(state)?.title,
              eta: Number(Math.max(0, (getNextEvent(state)?.triggerTime ?? 0) - state.phaseElapsed).toFixed(1)),
            }
          : null,
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action !== 'setControl' || !payload || typeof payload !== 'object') return null;
      const command = payload as { control?: string; value?: number };
      if (typeof command.value !== 'number') return null;
      switch (command.control) {
        case 'baseThrust':
          state.controls.baseThrust = clamp01(command.value);
          return state.controls.baseThrust;
        case 'vectorBias':
          state.controls.vectorBias = clampSigned(command.value);
          return state.controls.vectorBias;
        case 'fuelMix':
          state.controls.fuelMix = clampSigned(command.value);
          return state.controls.fuelMix;
        case 'throttle':
          state.ascent.thrust = clamp01(command.value);
          return state.ascent.thrust;
        default:
          return null;
      }
    },
    exit() {
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointerleave', pointerUp);
      stopAmbientLoop();
    },
  };

  return game;
};

function successSummary(accuracy: number) {
  if (accuracy > 0.95) return 'Perfect burn! The crew is weightless before the second marker.';
  if (accuracy > 0.8) return 'Smooth climb with minor course nudges.';
  if (accuracy > 0.6) return 'Orbit achieved, but engineering wants more headroom.';
  return 'Barely scraped orbit—review telemetry before the next sortie.';
}

function failureSummary(state: StarshipState) {
  if (state.ascent.integrity <= 0) return 'Hull fracture from debris stress—abort triggered.';
  if (state.ascent.heat >= 140) return 'Core overheated; emergency shutdown before detonation.';
  return 'Lost ascent solution—mission control pulled you back.';
}

function updateStars(stars: StarSprite[], dt: number, stage: { width: number; height: number }) {
  for (const star of stars) {
    star.y += star.speed * dt * 40;
    if (star.y > stage.height) {
      star.y = 0;
      star.x = Math.random() * stage.width;
      star.size = 0.5 + Math.random() * 2;
    }
  }
}

function createStars(width: number, height: number): StarSprite[] {
  return Array.from({ length: 90 }, () => ({
    x: Math.random() * Math.max(1, width),
    y: Math.random() * Math.max(1, height),
    speed: 0.1 + Math.random() * 0.6,
    size: 0.5 + Math.random() * 2,
  }));
}

function drawBackdrop(g: CanvasRenderingContext2D, width: number, height: number, stars: StarSprite[]) {
  const gradient = g.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#030816');
  gradient.addColorStop(1, '#041f38');
  g.fillStyle = gradient;
  g.fillRect(0, 0, width, height);

  g.save();
  g.fillStyle = '#9edbff';
  for (const star of stars) {
    g.globalAlpha = 0.2 + star.size * 0.1;
    g.fillRect(star.x, star.y, star.size, star.size);
  }
  g.restore();
}

function renderPrep(
  g: CanvasRenderingContext2D,
  stage: { width: number; height: number },
  state: StarshipState,
  pointer: PointerState,
) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  drawMissionPanel(g, 88, 96, 290, state, 'prep');
  drawSlider(g, {
    label: 'Booster Power',
    x: w * 0.08,
    y: h * 0.34,
    width: 40,
    height: h * 0.42,
    value: state.controls.baseThrust,
    vertical: true,
    readout: `${Math.round(state.controls.baseThrust * 100)}%  A/D`,
  });
  drawDial(g, {
    label: 'Vector Bias',
    cx: w * 0.35,
    cy: h * 0.65,
    radius: 60,
    value: state.controls.vectorBias,
    readout: `${formatPercentSigned(state.controls.vectorBias)}  W/S`,
  });
  drawSlider(g, {
    label: 'Fuel Mix',
    x: w * 0.55,
    y: h * 0.75,
    width: w * 0.35,
    height: 28,
    value: (state.controls.fuelMix + 1) / 2,
    vertical: false,
    readout: `${formatPercentSigned(state.controls.fuelMix)}  Q/E`,
  });

  g.fillStyle = '#7de3ff';
  g.font = '26px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Prep: Solve the noisy launch equation', w / 2, h * 0.12);
  g.font = '16px "Space Mono", monospace';
  g.fillStyle = '#9edcff';
  g.fillText('Match projected burn to the telemetry target, then commit with Enter.', w / 2, h * 0.16);

  const interactionLabel = pointer.active && pointer.mode
    ? `Dragging ${pointer.mode.replace('-', ' ')}`
    : 'Mouse drag also works on any highlighted control';
  drawHintStrip(g, w / 2 - 220, h - 70, 440, 34, interactionLabel);
}

function renderCommit(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  drawMissionPanel(g, 88, 110, 290, state, 'commit');
  const barWidth = w * 0.6;
  const x = (w - barWidth) / 2;
  const y = h * 0.45;
  g.fillStyle = 'rgba(10, 24, 44, 0.75)';
  g.fillRect(x, y - 18, barWidth, 60);
  g.strokeStyle = 'rgba(99, 201, 255, 0.25)';
  g.strokeRect(x, y - 18, barWidth, 60);
  g.fillStyle = '#143d73';
  g.fillRect(x + 12, y + 2, barWidth - 24, 20);
  g.fillStyle = '#0ff';
  const cursorPos = x + state.commit.cursor * barWidth;
  g.fillRect(cursorPos - 5, y - 16, 10, 56);
  g.strokeStyle = '#ffec6e';
  g.lineWidth = 3;
  g.strokeRect(x + barWidth / 2 - 28, y - 6, 56, 36);
  g.fillStyle = '#7de3ff';
  g.font = '28px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText('Commit: Time ignition!', w / 2, h * 0.32);
  g.font = '16px "Space Mono", monospace';
  g.fillStyle = '#9edcff';
  g.fillText('Center hit boosts the launch; press Enter or Space in the gold window.', w / 2, h * 0.37);
  drawHintStrip(g, w / 2 - 180, y + 62, 360, 30, 'Enter / Space to fire the stack');
}

function renderAscent(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  drawAscentScene(g, stage.width, stage.height, state);
  renderAscentParticles(g, state.exhaust);
  renderAscentParticles(g, state.debris);
  drawMissionPanel(g, 34, 84, 310, state, 'ascent');
  drawSlider(g, {
    label: 'Live Thrust',
    x: stage.width - 70,
    y: stage.height * 0.2,
    width: 32,
    height: stage.height * 0.6,
    value: state.ascent.thrust,
    vertical: true,
    readout: `${Math.round(state.ascent.thrust * 100)}%  W/S`,
  });
  drawTimeline(g, state, stage.width, stage.height);
  drawHintStrip(g, stage.width - 332, stage.height - 126, 280, 30, 'Hold Space to vent heat');
}

function renderDebrief(g: CanvasRenderingContext2D, stage: { width: number; height: number }, state: StarshipState) {
  const { width: w, height: h } = stage;
  drawShipSilhouette(g, w, h, state.ascent.altitude);
  const cardWidth = Math.min(520, w * 0.8);
  const x = (w - cardWidth) / 2;
  const y = h * 0.3;
  g.fillStyle = 'rgba(5, 12, 24, 0.92)';
  g.fillRect(x, y, cardWidth, 254);
  g.strokeStyle = '#61d7ff';
  g.lineWidth = 2;
  g.strokeRect(x, y, cardWidth, 254);
  if (state.debrief) {
    g.fillStyle = state.debrief.outcome === 'success' ? '#8dffb7' : '#ff9f9f';
    g.font = '32px "Space Mono", monospace';
    g.textAlign = 'center';
    g.fillText(state.debrief.outcome === 'success' ? 'Orbit Achieved' : 'Mission Aborted', w / 2, y + 48);
    g.fillStyle = '#d6f5ff';
    g.font = '18px "Space Mono", monospace';
    g.fillText(`Accuracy ${(state.debrief.accuracy * 100).toFixed(1)}%`, w / 2, y + 90);
    wrapText(g, state.debrief.summary, w / 2, y + 130, cardWidth - 40, 20);
    g.fillStyle = '#7de3ff';
    g.fillText(`Rewards: ${state.debrief.rewards} star credits`, w / 2, y + 186);
    g.fillStyle = '#9edcff';
    g.fillText(
      `Peak heat ${state.ascent.peakHeat.toFixed(0)}  ·  Hull ${state.ascent.integrity.toFixed(0)}%  ·  Avg burn ${Math.round(getAverageBurn(state))}`,
      w / 2,
      y + 214,
    );
    g.font = '16px "Space Mono", monospace';
    g.fillText('Press Enter to prep the next launch', w / 2, y + 238);
  }
}

function renderStatusBar(
  g: CanvasRenderingContext2D,
  stage: { width: number; height: number },
  state: StarshipState,
  title: string,
) {
  g.save();
  g.fillStyle = 'rgba(2, 6, 12, 0.88)';
  g.fillRect(0, 0, stage.width, 56);
  g.fillStyle = '#93e7ff';
  g.font = '18px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(title, 18, 22);
  drawPhaseChip(g, state.phase, 242, 8);
  g.textAlign = 'right';
  g.font = '13px "Space Mono", monospace';
  g.fillStyle = '#7de3ff';
  g.fillText(phaseObjective(state.phase), stage.width - 18, 22);
  g.textAlign = 'center';
  g.font = '14px "Space Mono", monospace';
  g.fillStyle = '#9edcff';
  g.fillText(state.statusMessage, stage.width / 2, 44);
  g.restore();
}

function drawShipSilhouette(g: CanvasRenderingContext2D, w: number, h: number, altitude: number) {
  const pose = getShipPose(w, h, altitude, 0, 0);
  g.save();
  g.translate(pose.x, pose.y);
  g.fillStyle = '#0f2337';
  g.strokeStyle = '#6bdcff';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 120);
  g.lineTo(40, -80);
  g.lineTo(80, 120);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(109, 214, 255, 0.18)';
  g.beginPath();
  g.moveTo(-36, 120);
  g.lineTo(116, 120);
  g.stroke();
  g.restore();
}

function drawMissionPanel(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  panelWidth: number,
  state: StarshipState,
  mode: 'prep' | 'commit' | 'ascent',
) {
  const panelHeight = mode === 'ascent' ? 408 : mode === 'commit' ? 236 : 274;
  const estimatedTarget = getTelemetryTarget(state);
  const projectedBurn = getProjectedBurn(state);
  const activeEvent = getActiveEvent(state);
  const nextEvent = getNextEvent(state);
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(10, 24, 44, 0.88)';
  g.fillRect(0, 0, panelWidth, panelHeight);
  g.strokeStyle = 'rgba(109, 214, 255, 0.32)';
  g.strokeRect(0, 0, panelWidth, panelHeight);
  g.fillStyle = '#8af3ff';
  g.font = '15px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(mode === 'ascent' ? 'Mission Telemetry' : 'Telemetry Solution', 14, 24);
  g.fillStyle = '#d7f8ff';
  g.font = '14px "Space Mono", monospace';
  g.fillText(`G  ${state.telemetry.displayGravity.toFixed(1)}`, 14, 56);
  g.fillText(`W  ${state.telemetry.displayWind.toFixed(1)}`, 14, 82);
  g.fillText(`Noise  +/-${state.telemetry.noise.toFixed(1)}`, 14, 108);
  g.fillStyle = '#7de3ff';
  g.fillText(`Telemetry target  ~${Math.round(estimatedTarget)}`, 14, 142);
  g.fillText(`Projected burn   ${Math.round(projectedBurn)}`, 14, 168);
  g.fillText(`Offset           ${formatDelta(projectedBurn - estimatedTarget)}`, 14, 194);

  if (mode === 'ascent') {
    drawMeter(g, 14, 226, panelWidth - 28, 10, state.ascent.altitude / state.ascent.targetAltitude, '#77f7c2', 'Orbit');
    drawMeter(g, 14, 254, panelWidth - 28, 10, state.ascent.integrity / 100, '#68cbff', 'Hull');
    drawMeter(g, 14, 282, panelWidth - 28, 10, state.ascent.heat / 140, state.ascent.heat > 110 ? '#ff8e7f' : '#ffcf6e', 'Heat');
    g.fillStyle = '#d7f8ff';
    g.font = '13px "Space Mono", monospace';
    g.fillText(`Altitude  ${Math.round(state.ascent.altitude)} / ${state.ascent.targetAltitude} m`, 14, 322);
    g.fillText(`Velocity  ${Math.round(state.ascent.velocity)} m/s`, 14, 346);
    g.fillText(`Burn  ${Math.round(state.ascent.lastThrust)}   Avg  ${Math.round(getAverageBurn(state))}`, 14, 370);
    g.fillStyle = activeEvent ? '#ffec6e' : '#9edcff';
    g.fillText(
      activeEvent
        ? `Event  ${activeEvent.title}`
        : nextEvent
          ? `Next  ${nextEvent.title}  ${Math.max(0, nextEvent.triggerTime - state.phaseElapsed).toFixed(1)}s`
          : 'Event lane clear',
      14,
      394,
    );
  } else if (mode === 'commit') {
    g.fillStyle = '#9edcff';
    g.fillText('Centered hits lift thrust ceiling.', 14, 218);
    g.fillText('Closer to the gold window means a cleaner launch.', 14, 244);
  } else {
    g.fillStyle = '#9edcff';
    g.fillText('Match burn to target before commit.', 14, 234);
    g.fillText('Vector trims. Fuel nudges.', 14, 260);
  }
  g.restore();
}

function drawSlider(
  g: CanvasRenderingContext2D,
  opts: { label: string; x: number; y: number; width: number; height: number; value: number; vertical: boolean; readout?: string },
) {
  const { label, x, y, width, height, value, vertical, readout } = opts;
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(8, 18, 34, 0.7)';
  g.fillRect(0, 0, width, height);
  g.fillStyle = '#1d3d66';
  g.fillRect(4, 4, width - 8, height - 8);
  g.fillStyle = '#7de3ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, width / 2, -14);
  g.fillStyle = '#f5f76d';
  if (vertical) {
    const knobY = (1 - value) * (height - 16);
    g.fillRect(4, knobY, width - 8, 16);
  } else {
    const knobX = value * (width - 16);
    g.fillRect(knobX, 4, 16, height - 8);
  }
  if (readout) {
    g.fillStyle = '#9edcff';
    g.font = '12px "Space Mono", monospace';
    g.fillText(readout, width / 2, height + 18);
  }
  g.restore();
}

function drawDial(g: CanvasRenderingContext2D, opts: { label: string; cx: number; cy: number; radius: number; value: number; readout?: string }) {
  const { label, cx, cy, radius, value, readout } = opts;
  g.save();
  g.translate(cx, cy);
  g.fillStyle = 'rgba(12, 22, 40, 0.76)';
  g.beginPath();
  g.arc(0, 0, radius, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#5cc6ff';
  g.lineWidth = 2;
  g.stroke();
  const angle = (-Math.PI / 2) + value * Math.PI;
  g.strokeStyle = '#f5f76d';
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(Math.cos(angle) * (radius - 14), Math.sin(angle) * (radius - 14));
  g.stroke();
  g.fillStyle = '#7de3ff';
  g.font = '14px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, 0, radius + 20);
  if (readout) {
    g.fillStyle = '#9edcff';
    g.font = '12px "Space Mono", monospace';
    g.fillText(readout, 0, radius + 40);
  }
  g.restore();
}

function drawTimeline(g: CanvasRenderingContext2D, state: StarshipState, width: number, height: number) {
  const timelineWidth = width * 0.65;
  const x = (width - timelineWidth) / 2;
  const y = height - 92;
  const activeEvent = getActiveEvent(state);
  const nextEvent = getNextEvent(state);
  g.save();
  g.fillStyle = 'rgba(5, 12, 24, 0.8)';
  g.fillRect(x, y, timelineWidth, 58);
  g.strokeStyle = '#143d66';
  g.strokeRect(x, y, timelineWidth, 58);
  const total = state.ascent.targetAltitude;
  g.fillStyle = '#77f7c2';
  g.fillRect(x, y + 46, timelineWidth * clamp01(state.ascent.altitude / total), 6);
  for (const event of state.ascent.events) {
    const marker = x + (event.triggerTime / 60) * timelineWidth;
    g.fillStyle =
      event.status === 'resolved'
        ? '#64ffa3'
        : event.status === 'active'
        ? '#ffec6e'
          : '#5c79b0';
    g.fillRect(marker - 2, y + 4, 4, 28);
  }
  g.fillStyle = '#7de3ff';
  g.font = '12px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText('Events timeline', x + 8, y + 16);
  g.textAlign = 'right';
  g.fillStyle = activeEvent ? '#ffec6e' : '#9edcff';
  g.fillText(
    activeEvent
      ? activeEvent.title
      : nextEvent
        ? `${nextEvent.title} in ${Math.max(0, nextEvent.triggerTime - state.phaseElapsed).toFixed(1)}s`
        : 'Clear corridor',
    x + timelineWidth - 8,
    y + 16,
  );
  g.restore();
}

function drawAscentScene(g: CanvasRenderingContext2D, w: number, h: number, state: StarshipState) {
  const ship = getShipPose(w, h, state.ascent.altitude, state.controls.vectorBias, state.elapsed);
  g.save();
  const atmosphere = g.createLinearGradient(0, h * 0.6, 0, h);
  atmosphere.addColorStop(0, 'rgba(20, 72, 112, 0)');
  atmosphere.addColorStop(1, 'rgba(36, 122, 184, 0.16)');
  g.fillStyle = atmosphere;
  g.fillRect(0, h * 0.6, w, h * 0.4);

  g.fillStyle = '#0a1624';
  g.beginPath();
  g.moveTo(ship.x - 24, ship.y + 80);
  g.lineTo(ship.x, ship.y - 110);
  g.lineTo(ship.x + 24, ship.y + 80);
  g.closePath();
  g.fill();
  g.strokeStyle = '#9de9ff';
  g.stroke();
  g.strokeStyle = 'rgba(109, 214, 255, 0.18)';
  g.beginPath();
  g.moveTo(ship.x - 40, ship.y + 80);
  g.lineTo(ship.x + 40, ship.y + 80);
  g.stroke();
  g.restore();
}

function renderAscentParticles(g: CanvasRenderingContext2D, particles: Particle[]) {
  g.save();
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    g.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha * p.alpha})`;
    g.fillRect(p.x, p.y, p.size, p.size * 3);
  }
  g.restore();
}

function spawnExhaust(state: StarshipState, dt: number, stage: { width: number; height: number }) {
  const ship = getShipPose(stage.width, stage.height, state.ascent.altitude, state.controls.vectorBias, state.elapsed);
  const spawnCount = Math.floor(dt * 120);
  for (let i = 0; i < spawnCount; i++) {
    state.exhaust.push({
      x: ship.x - 6 + state.rng() * 12,
      y: ship.y + 88 + state.rng() * 14,
      vx: (state.rng() - 0.5) * 44 + state.controls.vectorBias * 18,
      vy: 140 + state.rng() * 170,
      life: 0,
      maxLife: 0.6 + state.rng() * 0.6,
      size: 4 + state.rng() * 2,
      hue: 190 + state.rng() * 40,
      alpha: 0.6,
    });
  }
}

function maybeSpawnDebris(state: StarshipState, dt: number, stage: { width: number; height: number }) {
  if (state.rng() < dt * 0.5) {
    state.debris.push({
      x: stage.width + 20,
      y: 120 + state.rng() * (stage.height * 0.45),
      vx: -60 - state.rng() * 80,
      vy: 20 + state.rng() * 40,
      life: 0,
      maxLife: 2 + state.rng() * 1.5,
      size: 3 + state.rng() * 3,
      hue: 20 + state.rng() * 20,
      alpha: 0.8,
    });
  }
}

function updateParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (!p) continue;
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
    }
  }
}

function wrapText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  g.textAlign = 'center';
  const words = text.split(' ');
  let line = '';
  let offset = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (g.measureText(test).width > maxWidth && line) {
      g.fillText(line, x, y + offset);
      line = `${word} `;
      offset += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) g.fillText(line.trim(), x, y + offset);
}

function updatePointerControl(pointer: PointerState, state: StarshipState, stage: { width: number; height: number }) {
  if (!pointer.mode) return;
  const { width: w, height: h } = stage;
  switch (pointer.mode) {
    case 'base-thrust': {
      const slider = { x: w * 0.08, y: h * 0.34, height: h * 0.42 };
      const ratio = 1 - clamp01((pointer.y - slider.y) / slider.height);
      state.controls.baseThrust = ratio;
      break;
    }
    case 'vector': {
      const dial = { cx: w * 0.35, cy: h * 0.65 };
      const dx = pointer.x - dial.cx;
      const dy = pointer.y - dial.cy;
      const angle = Math.atan2(dy, dx);
      state.controls.vectorBias = clampSigned((angle + Math.PI / 2) / Math.PI);
      break;
    }
    case 'fuel': {
      const slider = { x: w * 0.55, width: w * 0.35 };
      const ratio = clamp01((pointer.x - slider.x) / slider.width);
      state.controls.fuelMix = ratio * 2 - 1;
      break;
    }
    case 'throttle': {
      const slider = { y: stage.height * 0.2, height: stage.height * 0.6, x: stage.width - 70 };
      const ratio = 1 - clamp01((pointer.y - slider.y) / slider.height);
      state.ascent.thrust = ratio;
      break;
    }
  }
}

function resolvePointerMode(x: number, y: number, stage: { width: number; height: number }, phase: StarshipState['phase']) {
  const { width: w, height: h } = stage;
  if (phase === 'prep') {
    if (hitRect(x, y, w * 0.08, h * 0.34, 40, h * 0.42)) return 'base-thrust';
    if (hitCircle(x, y, w * 0.35, h * 0.65, 70)) return 'vector';
    if (hitRect(x, y, w * 0.55, h * 0.75, w * 0.35, 40)) return 'fuel';
  } else if (phase === 'ascent') {
    if (hitRect(x, y, w - 70, h * 0.2, 32, h * 0.6)) return 'throttle';
  }
  return null;
}

function hitRect(px: number, py: number, x: number, y: number, width: number, height: number) {
  return px >= x && px <= x + width && py >= y && py <= y + height;
}

function hitCircle(px: number, py: number, cx: number, cy: number, radius: number) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function toStageCoords(event: PointerEvent, stage: { canvas: HTMLCanvasElement; width: number; height: number }) {
  const rect = stage.canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * stage.width;
  const y = ((event.clientY - rect.top) / rect.height) * stage.height;
  return { x, y };
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function clampSigned(v: number) {
  return Math.min(1, Math.max(-1, v));
}

function drawMeter(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  color: string,
  label: string,
) {
  g.save();
  g.fillStyle = '#08121f';
  g.fillRect(x, y, width, height);
  g.fillStyle = color;
  g.fillRect(x, y, width * clamp01(value), height);
  g.strokeStyle = 'rgba(109, 214, 255, 0.24)';
  g.strokeRect(x, y, width, height);
  g.fillStyle = '#9edcff';
  g.font = '12px "Space Mono", monospace';
  g.textAlign = 'left';
  g.fillText(label, x, y - 4);
  g.restore();
}

function drawHintStrip(g: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, text: string) {
  g.save();
  g.fillStyle = 'rgba(4, 10, 18, 0.74)';
  g.fillRect(x, y, width, height);
  g.strokeStyle = 'rgba(109, 214, 255, 0.28)';
  g.strokeRect(x, y, width, height);
  g.fillStyle = '#9edcff';
  g.font = '13px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(text, x + width / 2, y + 20);
  g.restore();
}

function drawPhaseChip(g: CanvasRenderingContext2D, phase: StarshipState['phase'], x: number, y: number) {
  const label = phase.toUpperCase();
  const width = 110;
  g.save();
  g.fillStyle = 'rgba(17, 44, 72, 0.9)';
  g.fillRect(x, y, width, 24);
  g.strokeStyle = 'rgba(109, 214, 255, 0.36)';
  g.strokeRect(x, y, width, 24);
  g.fillStyle = '#9edcff';
  g.font = '12px "Space Mono", monospace';
  g.textAlign = 'center';
  g.fillText(label, x + width / 2, y + 16);
  g.restore();
}

function phaseObjective(phase: StarshipState['phase']) {
  switch (phase) {
    case 'prep':
      return 'Tune projected burn to the telemetry target';
    case 'commit':
      return 'Center the ignition cursor';
    case 'ascent':
      return 'Reach orbit without cooking the hull';
    case 'debrief':
      return 'Review the run and relaunch';
  }
}

function getTelemetryTarget(state: StarshipState) {
  return state.telemetry.displayGravity * state.telemetry.displayWind;
}

function getProjectedBurn(state: StarshipState) {
  const baseBurn = computeBaseThrust(state);
  const vectorPenalty = 1 - Math.abs(state.controls.vectorBias) * 0.08;
  const fuelBonus = 1 + state.controls.fuelMix * 0.05;
  return baseBurn * vectorPenalty * fuelBonus;
}

function getAverageBurn(state: StarshipState) {
  return state.ascent.burnTime > 0
    ? state.ascent.burnIntegral / state.ascent.burnTime
    : getProjectedBurn(state);
}

function getActiveEvent(state: StarshipState) {
  return state.ascent.events.find(evt => evt.status === 'active') ?? null;
}

function getNextEvent(state: StarshipState) {
  return state.ascent.events.find(evt => evt.status === 'upcoming') ?? null;
}

function getShipPose(width: number, height: number, altitude: number, vectorBias: number, elapsed: number) {
  const baseX = width * 0.3 + vectorBias * 44;
  const baseY = height * 0.72 - Math.min((altitude / 1800), height * 0.34);
  const wobble = Math.sin(elapsed * 3.5) * 4;
  return {
    x: baseX + wobble,
    y: baseY,
  };
}

function formatPercentSigned(value: number) {
  const pct = Math.round(value * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function formatDelta(value: number) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}
