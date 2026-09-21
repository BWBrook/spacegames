# Audio Sources

| Cue | File | Pack | Notes |
| --- | --- | --- | --- |
| `starship/prep-ambience` | `AMBMisc_Ambience High 02_RSCPC_PX.wav` | Rescopic Sound – Parallax (99Sounds version) | Converted to OGG (44100 Hz) for looping launch-pad bed. |
| `starship/ignition` | `SCIWeap_Shot Plasma BF 04_RSCPC_SFEW.wav` | Rescopic Sound – Sci-Fi Energy Weapons (99Sounds version) | Trimmed/downsamped to 44.1 kHz WAV for ignition burst. |
| `starship/vent` | `SCIWeap_Reload Plasma G 02_RSCPC_SFEW.wav` | Sci-Fi Energy Weapons | Short hiss for heat venting indicator. |
| `starship/warning` | `SCIMisc_Ping 28_RSCPC_PX.wav` | Parallax | Resonant ping used for telemetry/event alerts. |
| `starship/success` | `SCIMisc_Texture Small 03_RSCPC_PX.wav` | Parallax | First 5s clipped for debrief success sting. |
| `starship/failure` | `DSGNSynth_Hit Large Tight 16_RSCPC_PX.wav` | Parallax | Punchy impact for failure screen. |
| `evil-alien/detonate` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Bomb detonation. |
| `evil-alien/hit` | reuses `starship/success` | Parallax | `*BOOM*` debrief sting. |
| `evil-alien/fail` | reuses `starship/failure` | Parallax | Out-of-bombs and captured debriefs. |
| `evil-alien/alarm` | reuses `starship/warning` | Parallax | Proximity ping at 50%, 75%, 90%. |
| `bug-eyes/blast` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Proton blaster hit. |
| `bug-eyes/miss` | reuses `starship/vent` | Sci-Fi Energy Weapons | Missed bug slipping away. |
| `bug-eyes/caught` | reuses `starship/failure` | Parallax | A bug reaches you. |
| `bug-eyes/debrief` | reuses `starship/success` | Parallax | Escape debrief sting. |
| `moonlander/thrust` | reuses `starship/prep-ambience` | Parallax | Looped descent burn, gain tracks the throttle. |
| `moonlander/touchdown` | reuses `starship/success` | Parallax | Landing sting. |
| `moonlander/crash` | reuses `starship/failure` | Parallax | Impact. |

All material originates from the free **Sci-Fi Sound Effects** bundle on 99Sounds (Rescopic Sound, 24-bit/96 kHz WAV, royalty-free for commercial use). See https://99sounds.org/sci-fi-sounds/ for license terms. The original pack is not stored in this repo; the filenames above preserve provenance, while the playable derivatives live under `public/audio/`.
