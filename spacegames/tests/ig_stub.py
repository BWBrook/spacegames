import math, random
from spacegames.c64 import C64
c64 = C64()
rng = random.Random(42)

def main():
    pass  # declarations follow
    print("INTERGALACTIC GAMES")
    H=int(rng.random()*100+1)
    print("YOU MUST LAUNCH A SATELLITE.")
    print("TO A HEIGHT OF ", H)
    G = 0  # pre-declare for linters
    for G in range(1, 10 + 1):
        print("ENTER ANGLE (0-90)")
        A = int(input("> ").strip())
        print("ENTER SPEED (0-40000)")
        V = int(input("> ").strip())
        A=A-math.atan(H/3)*180/3.14159
        V=V-3000*math.sqrt(H/(H+1))
        if abs(A)<2 and abs(V)<100:
            print("YOU'VE DONE IT!")
            return
        if A<-2: print("TOO SHALLOW")
        if A>2: print("TOO STEEP")
        if V<100: print("TOO SLOW")
        if V>100: print("TOO FAST")
        print("YOU'VE FAILED")
        print("ROCKET HAS MISFIRED")
    pass  # NEXT
    print("ROCKET IS IN ORBIT")
    print("NCTV WINS-THANKS TO YOU")
    B=int(1000/G)
    print("YOU'VE EARNED A")
    print("BONUS OF ", B, " CREDITS!")
    return

if __name__ == '__main__':
  main()
