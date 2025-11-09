export const STARSHIP_CONSTANTS = {
  prepDuration: 18, // seconds
  commitWindow: 4,
  commitCursorSpeed: 0.75, // cycles per second
  ascentTargetAltitude: 120_000, // meters
  gravityRange: [8, 26] as const,
  windRange: [12, 38] as const,
  baseThrustRange: [150, 950] as const,
  thrustAdjustmentPerSecond: 0.35,
  heatRisePerThrust: 22,
  heatCoolRate: 16,
  heatVentRate: 45,
  integrityDecayPerHit: 18,
  telemetryNoise: 3.5,
  telemetryDrift: 0.8,
  eventSpacing: [9, 14] as const,
  debrisSpawnRate: 14,
  exhaustParticles: 160,
};

export type StarshipConfig = typeof STARSHIP_CONSTANTS;
