# Computer Spacegames (Python Port)
Re-creating and studying the 13 micro-computer games from the 1982 Usborne
book **“Computer Spacegames”** and bringing them to life in modern Python.

Our goal is faithfulness over flash: every port retains the original 40×25
text layout, quirky timing loops, and integer math tricks that defined early
home computers.  

Extras such as colour, sound, or smooth ASCII animation are
deliberately postponed to a separate “re-imagined” branch.

---

## Quick Start

```bash
git clone https://github.com/BWBrook/spacegames.git
cd spacegames
python -m pip install -r requirements.txt      # only stdlib today
python -m spacegames.games.starship_takeoff    # launch first game
````

`c64.py` seeds its RNG from system entropy by default; pass
`C64(seed=42)` for deterministic test runs.

---

## Repository Layout

```
spacegames/
│
├─ basic/            # Original listings (.bas) exactly as typed in 1982
│   ├─ starship_takeoff.bas
│   ├─ intergalactic_games.bas
│   └─ evil_alien.bas
│
├─ spacegames/       # Installable package
│   ├─ c64.py        # 40×25 text-mode facade
│   ├─ basic2py.py   # cheap translator helper (ASCII-safe)
│   ├─ games/        # hand-polished Python ports
│   │   ├─ starship_takeoff.py
│   │   ├─ intergalactic_games.py
│   │   └─ evil_alien.py
│   └─ tests/        # pytest stubs and golden screen hashes
│
├─ docs/             # Book transcript, design notes
└─ README.md         # you are here
```

---

## Implementation Notes

* **c64.Screen** – in-memory 40×25 char buffer.  No colour attributes yet.
* **c64.raw_tty / GET** – non-blocking keyboard read; Windows and POSIX.
* **clear_console_line** – erases the prompt line on any terminal,
  including Windows cmd without external libraries.
* **basic2py.py** – converts many ZX-era tokens (LET, PRINT, RND, INT,
  ABS, SGN, SQR, ATN).  Control flow is still manual to keep the port
  readable.

---

## Game Progress

| Game                                   | Filename                 | Status | Notes                  |
| -------------------------------------- | ------------------------ | ------ | ---------------------- |
| 1. Starship Take-off                   | `starship_takeoff.py`    | Done   | input line clean-up    |
| 2. Intergalactic Games                 | `intergalactic_games.py` | Done   | bonus carry-over added |
| 3. Evil Alien                          | `evil_alien.py`          | Done   |                        |
| 4. Beat the Bug Eyes                   | *pending*                | TODO   | needs GOSUB support    |
| 5. Moonlander                          | *pending*                | TODO   | arrays, float maths    |
| 6. Monsters of Galacticon              | *pending*                | TODO   | DIM string array       |
| 7. Alien Snipers                       | *pending*                | TODO   |                        |
| 8. Asteroid Belt                       | *pending*                | TODO   | TAB alignment          |
| 9. Trip to the Future                  | *pending*                | TODO   |                        |
| 10. Death Valley                       | *pending*                | TODO   |                        |
| 11. Space Mines                        | *pending*                | TODO   | nested loops heavy     |
| 12. Space Rescue                       | *pending*                | TODO   |                        |
| 13. Touchdown (multiplatform variants) | *pending*                | TODO   | dialect switch         |


---

## Porting Workflow

1. Drop the original listing in `basic/`.
2. Run `python -m spacegames.basic2py basic/yourgame.bas > stub.py`.
3. Move `stub.py` to `spacegames/games/` and polish by hand:

   * keep one BASIC line per Python line,
   * add `if __name__ == "__main__": main()`,
   * ensure every literal string fits 40 columns.
4. Update tests and the table above.  Commit early and often.

---

## Contributing

Pull requests are welcome.  Please follow the style conventions already in
the repo:

* ASCII only – no smart quotes or em dashes.  Use `-` and plain quotes.
* Max line length 79.
* One semantic commit per change (game port, emulator tweak, doc update).

---

## License

MIT.  See `LICENSE` for full text.

Usborne granted permission for non-commercial re-use of their 1980s
listings. This repository distributes only short excerpts required for
historical study.

---

## Acknowledgements

* **Daniel Isaaman & Jenny Tyler** – original authors.
* **Usborne Publishing** – for releasing the books online.
* **Commodore 64 community** – documentation that made emulation trivial.

Happy retro-coding!
