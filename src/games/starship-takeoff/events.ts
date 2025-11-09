import { STARSHIP_CONSTANTS } from './constants';
import type { StarshipEvent, StarshipState, EventInstance } from './types';
import { randomRange } from './rng';

const EVENT_LIBRARY: StarshipEvent[] = [
  {
    id: 'solar-flare',
    title: 'Solar Flare',
    detail: 'Radiation storm scrambles telemetry; expect heavy jitter.',
    duration: 6,
    apply: state => {
      state.telemetry.noise += 3;
      state.statusMessage = 'Solar flare! Instruments saturated; fly by feel.';
    },
    onResolve: state => {
      state.telemetry.noise = Math.max(state.config.telemetryNoise, state.telemetry.noise - 3);
      state.statusMessage = 'Telemetry stabilizing after the flare.';
    },
  },
  {
    id: 'debris-field',
    title: 'Debris Field',
    detail: 'Dense junk cloud; reduce thrust or brace for impact.',
    duration: 4,
    apply: state => {
      state.ascent.integrity = Math.max(0, state.ascent.integrity - 10);
      state.statusMessage = 'Hull clattering—threading debris field!';
    },
  },
  {
    id: 'reactor-spike',
    title: 'Reactor Spike',
    detail: 'Fuel mix destabilizes, flooding heat exchangers.',
    duration: 5,
    apply: state => {
      state.ascent.heat += 30;
      state.statusMessage = 'Reactor spike! Vent heat pronto!';
    },
  },
  {
    id: 'alien-interceptor',
    title: 'Alien Interceptor',
    detail: 'Stray drone locks on; evasive maneuvers cut velocity.',
    duration: 5,
    apply: state => {
      state.ascent.velocity *= 0.75;
      state.statusMessage = 'Interceptor in pursuit—zigzag to shake it!';
    },
    onResolve: state => {
      state.statusMessage = 'Interceptor lost, resume optimal climb.';
    },
  },
];

export function buildEventSchedule(rng: () => number): EventInstance[] {
  if (!EVENT_LIBRARY.length) throw new Error('Starship event library is empty');
  const events: EventInstance[] = [];
  const [gapMin, gapMax] = STARSHIP_CONSTANTS.eventSpacing;
  let nextTime = randomRange(rng, gapMin, gapMax);
  const maxTime = 55;
  while (nextTime < maxTime) {
    const card = EVENT_LIBRARY[Math.floor(rng() * EVENT_LIBRARY.length)]!;
    events.push({
      id: `${card.id}-${events.length}`,
      title: card.title,
      detail: card.detail,
      triggerTime: nextTime,
      status: 'upcoming',
      event: card,
    });
    nextTime += randomRange(rng, gapMin, gapMax);
  }
  return events;
}

export function stepEvents(state: StarshipState, currentTime: number) {
  for (const evt of state.ascent.events) {
    if (evt.status === 'upcoming' && evt.triggerTime <= currentTime) {
      evt.status = 'active';
      evt.startedAt = currentTime;
      evt.event.apply(state);
    } else if (evt.status === 'active' && evt.startedAt !== undefined) {
      if (currentTime >= evt.startedAt + evt.event.duration) {
        evt.status = 'resolved';
        evt.event.onResolve?.(state);
      }
    }
  }
}
