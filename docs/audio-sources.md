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
| `galacticon/approach` | reuses `starship/warning` | Parallax | A monster arriving. |
| `galacticon/kill` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Weapon that works. |
| `galacticon/nothing` | reuses `starship/vent` | Sci-Fi Energy Weapons | Weapon that does nothing. |
| `galacticon/loss` | reuses `starship/failure` | Parallax | Losing a member of the group. |
| `snipers/fire` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Laser hit. |
| `snipers/miss` | reuses `starship/vent` | Sci-Fi Energy Weapons | Missed shot. |
| `snipers/report` | reuses `starship/success` | Parallax | Gunnery report. |
| `belt/destroy` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Asteroid destroyed. |
| `belt/hit` | reuses `starship/failure` | Parallax | Hull struck. |
| `belt/report` | reuses `starship/success` | Parallax | Navigation log. |
| `trip/launch` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Departure. |
| `trip/home` | reuses `starship/success` | Parallax | Arriving home. |
| `trip/lost` | reuses `starship/failure` | Parallax | Dying on the way. |
| `valley/engine` | reuses `starship/prep-ambience` | Parallax | Looped Speed Dart engine. |
| `valley/crash` | reuses `starship/failure` | Parallax | Disintegration. |
| `valley/through` | reuses `starship/success` | Parallax | Out of the valley. |
| `mines/year` | reuses `starship/warning` | Parallax | End of year. |
| `mines/fail` | reuses `starship/failure` | Parallax | A leak, or losing office. |
| `mines/refused` | reuses `starship/vent` | Sci-Fi Energy Weapons | Orders the colony cannot afford. |
| `mines/term` | reuses `starship/success` | Parallax | Surviving the term. |
| `rescue/launch` | reuses `starship/ignition` | Sci-Fi Energy Weapons | Launch. |
| `rescue/hazard` | reuses `starship/warning` | Parallax | Trouble on the voyage. |
| `rescue/refused` | reuses `starship/vent` | Sci-Fi Energy Weapons | A plan the ship cannot fly. |
| `rescue/landed` | reuses `starship/success` | Parallax | A rescue. |
| `rescue/lost` | reuses `starship/failure` | Parallax | A failed mission. |
| `touchdown/engine` | reuses `starship/prep-ambience` | Parallax | Looped engine, gain tracks thrust. |
| `touchdown/landed` | reuses `starship/success` | Parallax | A safe landing. |
| `touchdown/crash` | reuses `starship/failure` | Parallax | A crash, or lost in space. |

All material originates from the free **Sci-Fi Sound Effects** bundle on 99Sounds (Rescopic Sound, 24-bit/96 kHz WAV, royalty-free for commercial use). See https://99sounds.org/sci-fi-sounds/ for license terms. The original pack is not stored in this repo; the filenames above preserve provenance, while the playable derivatives live under `public/audio/`.
