# -*- coding: utf-8 -*-
"""
Straight-through transcription of the ZX81 listing on p.6-7
of *Computer Spacegames* (1982).  No embellishments, no
modern UX-just the original logic running on our thin C-64 facade.
"""

from spacegames.c64 import C64
import sys

"""
## Starship Takeoff
You are a starship captain. You have crashed your ship on a strange 
planet and must take off again quickly in the alien ship you have captured. 
The ship's computer tells you the gravity on the planet. You must guess the 
force required for a successful take off. If you guess too low, the ship will 
not lift off the ground. If you guess too high, the ship's fail-safe mechanism 
comes into operation to prevent it being burnt up. If you are still on the 
planet after ten tries, the aliens will capture you.
"""

def main(c64: C64 | None = None) -> None:
    c64 = c64 or C64()
    c64.cls()

    row = 0
    c64.PRINT(row, 0, "STARSHIP TAKE-OFF"); row += 2

    # Generate planet gravity and required force ------------------
    G = int(c64.RND() * 20) + 1           # 30
    W = int(c64.RND() * 40) + 1           # 40
    R = G * W                             # 50

    c64.PRINT(row, 0, f"GRAVITY = {G}")   ; row += 1
    c64.PRINT(row, 0, "TYPE IN FORCE")    ; row += 2
    header_rows = row                     # remember start of log
    c64.refresh()

    feedback_row = header_rows  # sentinel to silence linters

    # Gameplay loop ----------------------------------------------
    for attempt in range(10):             # 80
        # prompt is on the host console, not in the C-64 buffer
        try:
            force = int(input("> ").strip())
        except ValueError:
            # clear garbage line and re-prompt
            c64.clear_console_line()
            continue

        # clear the line the user just typed on
        c64.clear_console_line()

        # echo guess onto the C-64 screen
        c64.PRINT(header_rows + attempt, 0, f"GUESS {attempt+1:2}: {force:5}")
        feedback_row = header_rows + attempt

        # evaluate -----------------------------------------------
        if force < R:
            c64.PRINT(feedback_row, 20, "TOO LOW ")
        elif force > R:
            c64.PRINT(feedback_row, 20, "TOO HIGH")
        else:
            c64.PRINT(feedback_row, 20, "RIGHT   ")
            c64.PRINT(feedback_row + 2, 0, "TAKE OFF SUCCESSFUL!")
            c64.refresh()
            return

        c64.refresh()

    # Ten failures ------------------------------------------------
    c64.PRINT(feedback_row + 2, 0, "YOU FAILED - THE ALIENS GOT YOU")
    c64.refresh()

if __name__ == "__main__":
    main()
# End of file