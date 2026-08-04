import type { GameFactory } from '../types';
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
import {
  clamp01,
  clampSigned,
  createStars,
  getActiveEvent,
  getAverageBurn,
  getNextEvent,
  getShipPose,
  getTelemetryTarget,
  renderStarship,
  resolvePointerMode,
  toStageCoords,
  updatePointerControl,
  updateStars,
} from './render';
import type { PointerState } from './render';
import { audioCues, type AudioCueId } from '../../assets/audio';

export const createGame: GameFactory = ({ stage, input, manifest: entry, audio }) => {
  const state = createStarshipState();
  const pointer: PointerState = { active: false, mode: null, x: 0, y: 0 };
  const stars = createStars(stage.width, stage.height);
  const audioBuffers = new Map<AudioCueId, AudioBuffer>();
  const activeEventAudio = new Set<string>();
  let ambientSource: AudioBufferSourceNode | null = null;
  let active = false;
  let ambientRequest = 0;
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
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
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
    const request = ++ambientRequest;
    const buffer = await loadCue('starship/prep-ambience');
    if (!active || request !== ambientRequest || !buffer || !audio.ctx) return;
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
    ambientRequest += 1;
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
      if (!active || !buffer) return;
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
      active = true;
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
      renderStarship(stage, state, pointer, stars, entry.title);
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
      active = false;
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
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
