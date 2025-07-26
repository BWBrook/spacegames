"""
INTERGALACTIC GAMES  –  BASIC port v2.0 (ASCII only)

* Keeps a history of up to 10 tries
* Feedback never overwrites the log
* After each win, automatically starts a new game, adding your bonus
"""

from math import atan, sqrt, pi
from spacegames.c64 import C64

"""
## Intergalactic Games

There is fierce competition among the world's TV companies for exclusive 
coverage of the First Intergalactic Games. Everything depends on which 
company wins the race to put a satellite into orbit at the right height.

You are the Engineer in charge of the launch for New Century TV. The 
crucial decisions about the angle and speed of the launching rocket rests 
on your shoulders. Can you do it?
"""

MAX_TRIES = 10          # original BASIC loop
LOG_HEIGHT = MAX_TRIES  # one row per attempt

def play_round(c64: C64, total_bonus: int) -> tuple[bool, int]:
    """
    Play one launch round.
    Returns (success, bonus_earned_this_round).
    """
    c64.cls()
    row = 0
    c64.PRINT(row, 0, "INTERGALACTIC GAMES"); row += 2

    H = int(c64.RND() * 100) + 1           # 20
    c64.PRINT(row, 0, "YOU MUST LAUNCH A SATELLITE."); row += 1
    c64.PRINT(row, 0, f"TO A HEIGHT OF {H}"); row += 2
    log_start = row                        # first row of log
    feedback_row = log_start + LOG_HEIGHT + 1
    prompt_row = feedback_row + 3          # leave gap
    c64.refresh()

    for g in range(1, MAX_TRIES + 1):
        # ---- ANGLE ---------------------------------------------------------
        c64.PRINT(prompt_row, 0, "ENTER ANGLE (0-90)       "); c64.refresh()
        try:
            A_in = float(input("> ").strip())
        except ValueError:
            c64.clear_console_line()
            continue
        c64.clear_console_line()

        # ---- SPEED ---------------------------------------------------------
        c64.PRINT(prompt_row + 1, 0, "ENTER SPEED (0-40000) "); c64.refresh()
        try:
            V_in = float(input("> ").strip())
        except ValueError:
            c64.clear_console_line()
            continue
        c64.clear_console_line()

        # ---- Log the guess -------------------------------------------------
        log_line = log_start + (g - 1)
        c64.PRINT(
            log_line,
            0,
            f"TRY {g:2}: ANG {A_in:5.1f}  SPD {V_in:7.0f}".ljust(40)
        )

        # ---- Transform to error space -------------------------------------
        A = A_in - atan(H / 3) * 180 / pi     # 100
        V = V_in - 3000 * sqrt(H / (H + 1))   # 110

        # ---- Success -------------------------------------------------------
        if abs(A) < 2 and abs(V) < 100:
            bonus = int(1000 / g)             # 222
            c64.PRINT(feedback_row, 0,  "YOU'VE DONE IT!".ljust(40))
            c64.PRINT(feedback_row + 1, 0,  "ROCKET IS IN ORBIT".ljust(40))
            c64.PRINT(feedback_row + 2, 0,  "NCTV WINS - THANKS".ljust(40))
            c64.PRINT(feedback_row + 4, 0,  "YOU'VE EARNED A".ljust(40))
            c64.PRINT(feedback_row + 5, 0,
                       f"BONUS OF {bonus} CREDITS!".ljust(40))
            c64.PRINT(feedback_row + 7, 0,
                       f"TOTAL CREDITS {total_bonus + bonus}".ljust(40))
            c64.refresh()
            return True, bonus

        # ---- Feedback ------------------------------------------------------
        fb_msgs = []
        if A < -2:   fb_msgs.append("TOO SHALLOW")
        if A >  2:   fb_msgs.append("TOO STEEP")
        if V < -100: fb_msgs.append("TOO SLOW")
        if V >  100: fb_msgs.append("TOO FAST")
        c64.PRINT(feedback_row, 0, " / ".join(fb_msgs).ljust(40))
        c64.PRINT(feedback_row + 1, 0, "ROCKET HAS MISFIRED ".ljust(40))
        c64.refresh()

    # ---- Out of turns ------------------------------------------------------
    c64.PRINT(feedback_row + 3, 0, "NO MORE FUEL - GAME OVER".ljust(40))
    c64.PRINT(feedback_row + 5, 0,
               f"TOTAL CREDITS {total_bonus}".ljust(40))
    c64.refresh()
    return False, 0


def main() -> None:
    c64 = C64()
    total = 0
    while True:
        won, bonus = play_round(c64, total)
        if not won:
            break
        total += bonus
        # short pause before next round
        input("\nPress ENTER for the next launch...")
        c64.clear_console_line()


if __name__ == "__main__":
    main()
# End of file