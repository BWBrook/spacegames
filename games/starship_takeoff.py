# -*- coding: utf-8 -*-
"""
Straight-through transcription of the ZX81 listing on p.6-7
of *Computer Spacegames* (1982).  No embellishments, no
modern UX-just the original logic running on our thin C-64 facade.
"""

from ..c64 import C64

def main(c64: C64 | None = None) -> None:
    c64 = c64 or C64()
    c64.cls()

    row = 0
    c64.PRINT(row, 0, "STARSHIP TAKE-OFF"); row += 2

    # 30 LET G = INT(RND*20)+1
    G = int(c64.RND() * 20) + 1
    # 40 LET W = INT(RND*80)+1
    W = int(c64.RND() * 80) + 1
    # 50 LET R = G*W
    R = G * W

    c64.PRINT(row, 0, f"GRAVITY = {G}"); row += 1
    c64.PRINT(row, 0, "TYPE IN FORCE"); row += 1
    c64.refresh()

    for attempt in range(10):                    # 80 FOR C=1 TO 10
        try:
            force = int(input("> ").strip())     #  90 INPUT F
        except ValueError:
            print("(numbers only)")
            continue

        if force < R:                            # 100 IF F<R THEN…
            c64.PRINT(row, 0, "TOO LOW        ")
        elif force > R:                          # 110 IF F>R THEN…
            c64.PRINT(row, 0, "TOO HIGH       ")
        else:                                    # 120 IF F=R THEN…
            c64.PRINT(row, 0, "RIGHT - TAKE OFF!")
            c64.refresh()
            return                               # successful launch
        c64.refresh()
        row += 1
        if attempt < 9:                          # 130 IF C<10 THEN…
            c64.PRINT(row, 0, "TRY AGAIN"); row += 1
            c64.refresh()

    # 150 PRINT "YOU FAILED — THE ALIENS GOT YOU"
    c64.PRINT(row, 0, "YOU FAILED - THE ALIENS GOT YOU")
    c64.refresh()
