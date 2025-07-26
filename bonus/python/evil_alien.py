import random

def evil_alien():
    """Main function for playing Evil Alien."""
    # Clear the screen (this is terminal-dependent, use as appropriate)
    print("\n" * 100)
    
    # Narrative introduction
    print("EVIL ALIEN")
    print(
        """
        Somewhere in the depths of space, Elron, the Evil Alien, is lurking beneath you. You’ve 
        managed to deactivate his long-range weapons, but he can still make his ship invisible 
        and use short-range attacks. You have tracked him to a three-dimensional grid in space.

        You are armed with four space bombs. You must find Elron’s exact location—X, Y, and 
        Distance coordinates—before he attacks. Each bomb can target one set of coordinates.

        You only have four bombs. Can you blast Elron out of space before he sneaks up and 
        captures you?
        """
    )
    
    # Choose difficulty level (set grid size)
    while True:
        try:
            difficulty = int(input("Choose difficulty level (1 = Easy, 2 = Medium, 3 = Hard): "))
            if difficulty == 1:
                S = 5  # Smaller grid for Easy
                break
            elif difficulty == 2:
                S = 10  # Standard grid for Medium
                break
            elif difficulty == 3:
                S = 20  # Larger grid for Hard
                break
            else:
                print("Please choose 1, 2, or 3.")
        except ValueError:
            print("Please enter a valid number (1, 2, or 3).")
    
    # Set number of guesses
    G = 4  # Fixed at 4 attempts (can be adjusted if needed)
    
    # Randomly generate the target position of Elron
    X = random.randint(0, S - 1)
    Y = random.randint(0, S - 1)
    D = random.randint(0, S - 1)
    
    # Game loop to give the player 4 attempts
    for i in range(1, G + 1):
        print(f"\nBomb #{i} - You have {G - i + 1} bombs left.")
        
        try:
            # Get player's guess for X, Y, and Distance
            X1 = int(input(f"X POSITION (0 to {S-1})? "))
            Y1 = int(input(f"Y POSITION (0 to {S-1})? "))
            D1 = int(input(f"DISTANCE (0 to {S-1})? "))
        except ValueError:
            print("Please enter valid numbers.")
            continue
        
        # Check if the player's guess is correct
        if X == X1 and Y == Y1 and D == D1:
            print("*BOOM* YOU GOT HIM!")
            return  # Player wins, end the game
        
        # Provide feedback on the guess
        print("SHOT WAS:")
        if Y1 > Y:
            print("NORTH")
        elif Y1 < Y:
            print("SOUTH")
        
        if X1 > X:
            print("EAST")
        elif X1 < X:
            print("WEST")
        
        if D1 > D:
            print("TOO FAR")
        elif D1 < D:
            print("NOT FAR ENOUGH")
    
    # If player runs out of bombs
    print("YOUR TIME HAS RUN OUT!!")
    print("Elron has slipped away...")

# Start the game
evil_alien()
