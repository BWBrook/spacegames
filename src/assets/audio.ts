export const audioCues = {
  'starship/prep-ambience': '/audio/sfx/starship/prep-ambience.ogg',
  'starship/ignition': '/audio/sfx/starship/ignition.wav',
  'starship/vent': '/audio/sfx/starship/vent.wav',
  'starship/warning': '/audio/sfx/starship/warning.wav',
  'starship/success': '/audio/sfx/starship/success.wav',
  'starship/failure': '/audio/sfx/starship/failure.wav',
  'evil-alien/detonate': '/audio/sfx/starship/ignition.wav',
  'evil-alien/hit': '/audio/sfx/starship/success.wav',
  'evil-alien/fail': '/audio/sfx/starship/failure.wav',
  'evil-alien/alarm': '/audio/sfx/starship/warning.wav',
  'bug-eyes/blast': '/audio/sfx/starship/ignition.wav',
  'bug-eyes/miss': '/audio/sfx/starship/vent.wav',
  'bug-eyes/caught': '/audio/sfx/starship/failure.wav',
  'bug-eyes/debrief': '/audio/sfx/starship/success.wav',
  'moonlander/thrust': '/audio/sfx/starship/prep-ambience.ogg',
  'moonlander/touchdown': '/audio/sfx/starship/success.wav',
  'moonlander/crash': '/audio/sfx/starship/failure.wav',
} as const;

export type AudioCueId = keyof typeof audioCues;
