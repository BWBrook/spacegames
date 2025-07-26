import random

def starship_takeoff():
    """Main function for playing the 'Starship Takeoff' game."""
    # Clear the screen (this is terminal-dependent, use as appropriate)
    print("\n" * 100)  
    
    # Narrative introduction
    print("STARSHIP TAKE-OFF")
    print(
        """
        You are a starship captain who has crash-landed on a dangerous alien planet. You’ve 
        managed to seize control of a nearby alien craft, but the planet's gravity is different 
        from anything you’ve encountered before. Your only chance for survival is to calculate 
        the exact force needed to lift off and escape.

        The ship's computer tells you the gravity of the planet, but it's up to you to calculate 
        the right force for a successful takeoff. If you guess too low, the ship won’t leave 
        the ground. Too high, and the ship's fail-safe mechanism will prevent it from burning 
        up in the atmosphere.

        You have 10 attempts before the aliens arrive to capture you. Choose wisely, Captain!
        """
    )
    
    # Generate random values for gravity (G) and weight (W)
    G = random.randint(1, 20)  # Gravity between 1 and 20
    W = random.randint(1, 40)  # Weight between 1 and 40
    
    # Calculate the required force (R)
    R = G * W
    
    # Display gravity
    print(f"GRAVITY = {G}")
    print("TYPE IN FORCE")
    
    # Allow up to 10 attempts
    for attempt in range(1, 11):
        try:
            # Get user input for force (F)
            F = int(input("Enter the force required for takeoff: "))
        except ValueError:
            print("Please enter a valid number.")
            continue
        
        # Check if the guess is too high, too low, or correct
        if F > R:
            print("TOO HIGH")
        elif F < R:
            print("TOO LOW")
        else:
            print("GOOD TAKE OFF!")
            return  # End the game if correct guess
        
        # If not correct and attempts left, print try again
        if attempt < 10:
            print("TRY AGAIN")
    
    # If player used all 10 attempts and didn't guess correctly
    print("YOU FAILED --")
    print("THE ALIENS GOT YOU")

# Start the game
starship_takeoff()
