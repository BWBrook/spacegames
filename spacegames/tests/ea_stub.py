import math, random
from spacegames.c64 import C64
c64 = C64()
rng = random.Random(42)

def main():
    pass  # declarations follow
    c64.cls()
    print("EVIL ALIEN")
    S=10
    G=4
    X=int(rng.random()*S)
    Y=int(rng.random()*S)
    D=int(rng.random()*S)
    for I in range(1, G + 1):
        print("X POSITION (0 TO 9)?")
        X1 = int(input("> ").strip())
        print("Y POSITION (0 TO 9)?")
        Y1 = int(input("> ").strip())
        print("DISTANCE (0 TO 9)?")
        D1 = int(input("> ").strip())
        if X==X1 and Y==Y1 and D==D1:
            print("*BOOM* YOU GOT HIM!")
            return
        print("SHOT WAS :")
        if Y1>Y: print("NORTH")
        if Y1<Y: print("SOUTH")
        if X1>X: print("EAST")
        if X1<X: print("WEST")
        print()
        if D1>D: print("TOO FAR")
        if D1<D: print("NOT FAR ENOUGH")
    pass  # NEXT
    print("YOUR TIME HAS RUN OUT!!")
    return

if __name__ == '__main__':
  main()
