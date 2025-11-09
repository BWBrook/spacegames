export const audioCues = {
  'starship/prep-ambience': '/audio/sfx/starship/prep-ambience.ogg',
  'starship/ignition': '/audio/sfx/starship/ignition.wav',
  'starship/vent': '/audio/sfx/starship/vent.wav',
  'starship/warning': '/audio/sfx/starship/warning.wav',
  'starship/success': '/audio/sfx/starship/success.wav',
  'starship/failure': '/audio/sfx/starship/failure.wav',
} as const;

export type AudioCueId = keyof typeof audioCues;
