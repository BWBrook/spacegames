import type { GameFactory } from '../types';
import {
  INTERGALACTIC_CONSTANTS,
  adjustAngle,
  adjustLaunchTrim,
  adjustSpeed,
  beginLaunch,
  clamp,
  clamp01,
  continueFromDebrief,
  createIntergalacticState,
  resolveLaunch,
  rewardSignalTiming,
} from './state';
import type { IntergalacticState } from './types';
import { createStars, renderIntergalactic, updateStars } from './render';

export const createGame: GameFactory = ({ stage, input, manifest }) => {
  const state = createIntergalacticState();
  const stars = createStars(stage.width, stage.height);

  function updateAim(dt: number) {
    const fine = input.isDown('Shift') ? 0.35 : 1;
    const angleStep = 18 * fine * dt;
    const speedStep = 5200 * fine * dt;
    if (input.isDown('ArrowLeft') || input.isDown('a')) adjustAngle(state, -angleStep);
    if (input.isDown('ArrowRight') || input.isDown('d')) adjustAngle(state, angleStep);
    if (input.isDown('ArrowDown') || input.isDown('s')) adjustSpeed(state, -speedStep);
    if (input.isDown('ArrowUp') || input.isDown('w')) adjustSpeed(state, speedStep);

    const angleOffset = state.angle - state.telemetryAngle;
    const speedOffset = state.speed - state.telemetrySpeed;
    if (Math.abs(angleOffset) <= 3.2 && Math.abs(speedOffset) <= 850) {
      state.statusMessage = 'Telemetry band is close. Enter will commit the launch.';
    } else if (Math.abs(angleOffset) > Math.abs(speedOffset) / 450) {
      state.statusMessage = angleOffset < 0 ? 'Analysts call that angle shallow.' : 'Analysts call that angle steep.';
    } else {
      state.statusMessage = speedOffset < 0 ? 'Rocket speed looks conservative.' : 'Rocket speed is running hot.';
    }

    if (input.consumePress('Enter') || input.consumePress(' ')) beginLaunch(state);
  }

  function updateFlight(dt: number) {
    const angleTrim = 3.2 * dt;
    const speedTrim = 620 * dt;
    let trimAngle = 0;
    let trimSpeed = 0;
    if (input.isDown('ArrowLeft') || input.isDown('a')) trimAngle -= angleTrim;
    if (input.isDown('ArrowRight') || input.isDown('d')) trimAngle += angleTrim;
    if (input.isDown('ArrowDown') || input.isDown('s')) trimSpeed -= speedTrim;
    if (input.isDown('ArrowUp') || input.isDown('w')) trimSpeed += speedTrim;
    if (trimAngle || trimSpeed) {
      adjustLaunchTrim(state, trimAngle, trimSpeed);
      state.statusMessage = 'Manual trim nudges the orbital insertion profile.';
    }

    const cursorSpeed = 0.68 + state.attempt * 0.035;
    state.signalCursor += state.signalDirection * cursorSpeed * dt;
    if (state.signalCursor >= 1) {
      state.signalCursor = 1;
      state.signalDirection = -1;
    } else if (state.signalCursor <= 0) {
      state.signalCursor = 0;
      state.signalDirection = 1;
    }
    state.signalLock = clamp01(state.signalLock - (0.018 + state.rivalCoverage * 0.018) * dt);
    state.rivalCoverage = clamp01(state.rivalCoverage + 0.018 * dt);

    if (input.consumePress(' ')) rewardSignalTiming(state);
    if (state.phaseElapsed >= INTERGALACTIC_CONSTANTS.flightDuration) resolveLaunch(state);
  }

  function updateDebrief() {
    if (state.phaseElapsed < 0.4) return;
    if (input.consumePress('Enter') || input.consumePress(' ')) continueFromDebrief(state);
  }

  return {
    update(dt: number) {
      state.elapsed += dt;
      state.phaseElapsed += dt;
      updateStars(stars, dt, stage.width, stage.height);
      switch (state.phase) {
        case 'aim':
          updateAim(dt);
          break;
        case 'flight':
          updateFlight(dt);
          break;
        case 'debrief':
          updateDebrief();
          break;
      }
    },
    render() {
      renderIntergalactic(stage, manifest.title, state, stars);
    },
    debugSnapshot() {
      return {
        gameId: manifest.id,
        phase: state.phase,
        status: state.statusMessage,
        targetHeight: state.targetHeight,
        attempt: state.attempt,
        maxAttempts: state.maxAttempts,
        controls: {
          angle: Number(state.angle.toFixed(2)),
          speed: Math.round(state.speed),
          telemetryAngle: Number(state.telemetryAngle.toFixed(2)),
          telemetrySpeed: Math.round(state.telemetrySpeed),
        },
        solution: {
          idealAngle: Number(state.idealAngle.toFixed(2)),
          idealSpeed: Math.round(state.idealSpeed),
          angleError: Number(((state.phase === 'flight' ? state.launchAngle : state.angle) - state.idealAngle).toFixed(2)),
          speedError: Math.round((state.phase === 'flight' ? state.launchSpeed : state.speed) - state.idealSpeed),
        },
        flight: {
          progress: Number(Math.min(1, state.phaseElapsed / INTERGALACTIC_CONSTANTS.flightDuration).toFixed(3)),
          signalCursor: Number(state.signalCursor.toFixed(3)),
          signalLock: Number(state.signalLock.toFixed(3)),
          rivalCoverage: Number(state.rivalCoverage.toFixed(3)),
        },
        debrief: state.debrief,
      };
    },
    debugAction(action: string, payload?: unknown) {
      if (action === 'solve') {
        state.angle = state.idealAngle;
        state.speed = state.idealSpeed;
        state.statusMessage = 'Debug solution loaded for browser smoke testing.';
        return { angle: state.angle, speed: state.speed };
      }
      if (action !== 'setControl' || !payload || typeof payload !== 'object') return null;
      const command = payload as { control?: string; value?: number };
      if (typeof command.value !== 'number') return null;
      switch (command.control) {
        case 'angle':
          state.angle = clamp(command.value, 0, 90);
          return state.angle;
        case 'speed':
          state.speed = clamp(command.value, 0, 40_000);
          return state.speed;
        case 'signalLock':
          state.signalLock = clamp01(command.value);
          return state.signalLock;
        default:
          return null;
      }
    },
  };
};
