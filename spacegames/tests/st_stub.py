import math, random
from spacegames.c64 import C64
c64 = C64()
rng = random.Random(42)

def main():
    pass  # declarations follow
    c64.cls()
    print("STARSHIP TAKE-OFF")
    G=int(rng.random()*20+1)
    W=int(rng.random()*40+1)
    R=G*W
    print("GRAVITY=", G)
    print("TYPE IN FORCE")
    for C in range(1, 10 + 1):
        F = int(input("> ").strip())
        if F>R: print("TOO HIGH")
        if F<R: print("TOO LOW")
        if F==R:
            print("GOOD TAKE OFF")
            return
        if C<10: print("TRY AGAIN")
    pass  # NEXT
    print("YOU FAILED --")
    print("THE ALIENS GOT YOU")
    return

if __name__ == '__main__':
  main()
