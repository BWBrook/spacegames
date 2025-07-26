"""
EVIL ALIEN  –  BASIC port (ASCII only)

Original logic:
* Hidden target (X, Y, D) each 0‒9
* Player gets 4 bombs
* After each shot the computer reports direction and distance
* Win prints "*BOOM* YOU GOT HIM!", otherwise "YOUR TIME HAS RUN OUT!!"
"""

from spacegames.c64 import C64

"""
## Evil Alien

Somewhere beneath you, in deepest, blackest space, lurks Elron, the Evil Alien. 
You have managed to deactivate all but his short-range weapons, but he can still 
make his ship invisible.

You know he is somewhere within the three-dimensional grid you can see on your 
ship's screen (see below), but where?

You have four space bombs. Each one can be exploded at a position in the grid 
specified by three numbers between 0 and 9, which your computer will ask you for. 
Can you blast the Evil Elron out of space before he creeps up and captures you?
"""

def main(c64: C64 | None = None) -> None:
    c64 = c64 or C64()
    c64.cls()

    # ----- Header -----------------------------------------------------------
    row = 0
    c64.PRINT(row, 0, "EVIL ALIEN"); row += 2

    S = 10      # grid (0-9)
    G = 4       # bombs

    X = int(c64.RND() * S)    # hidden coords
    Y = int(c64.RND() * S)
    D = int(c64.RND() * S)

    prompt_row = row
    log_start = prompt_row + 4      # leave blank row

    # ----- Gameplay ---------------------------------------------------------
    for shot in range(1, G + 1):
        # -- PROMPTS ---------------------------------------------------------
        c64.PRINT(prompt_row,     0, "X POSITION (0-9)?       "); c64.refresh()
        try:
            X1 = int(input("> ").strip())
        except ValueError:
            c64.clear_console_line()
            continue
        c64.clear_console_line()

        c64.PRINT(prompt_row + 1, 0, "Y POSITION (0-9)?       "); c64.refresh()
        try:
            Y1 = int(input("> ").strip())
        except ValueError:
            c64.clear_console_line()
            continue
        c64.clear_console_line()

        c64.PRINT(prompt_row + 2, 0, "DISTANCE (0-9)?         "); c64.refresh()
        try:
            D1 = int(input("> ").strip())
        except ValueError:
            c64.clear_console_line()
            continue
        c64.clear_console_line()

        # -- Logging & feedback block (3 rows) -------------------------------
        base = log_start + (shot - 1) * 3
        c64.PRINT(base, 0,
                  f"TRY {shot} : X {X1}  Y {Y1}  D {D1}".ljust(40))

        # -- Immediate hit ---------------------------------------------------
        if X == X1 and Y == Y1 and D == D1:
            c64.PRINT(log_start + (shot - 1) * 3, 0, "*BOOM* YOU GOT HIM!")
            c64.refresh()
            return

        # Direction — may show up to two words
        dirs = []
        if Y1 > Y: dirs.append("NORTH")
        if Y1 < Y: dirs.append("SOUTH")
        if X1 > X: dirs.append("EAST")
        if X1 < X: dirs.append("WEST")
        c64.PRINT(base + 1, 0,
                  ("SHOT WAS:  " + " ".join(dirs)).ljust(40))

        # Range feedback
        if D1 > D:
            rng_msg = "TOO FAR"
        elif D1 < D:
            rng_msg = "NOT FAR ENOUGH"
        else:
            rng_msg = "ON TARGET"
        c64.PRINT(base + 2, 0, ("RANGE    :  " + rng_msg).ljust(40))

        c64.refresh()

    # ----- Out of bombs -----------------------------------------------------
    c64.PRINT(log_start + G * 3 + 1, 0, "YOUR TIME HAS RUN OUT!!")
    c64.refresh()


if __name__ == "__main__":
    main()
# End of file