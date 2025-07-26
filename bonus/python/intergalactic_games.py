import random
import math

def intergalactic_games():
    """Main function for playing Intergalactic Games."""
    # Clear the screen (this is terminal-dependent, use as appropriate)
    print("\n" * 100)
    
    # Introduction narrative
    print("INTERGALACTIC GAMES")
    print(
        """
        Welcome to the First Intergalactic Games! The galaxy's top engineers are competing to 
        win exclusive broadcast rights for their respective companies. You are in charge of 
        launching a satellite for New Century TV.
        
        Your task: launch a satellite into orbit by choosing the right angle and speed. The 
        satellite must reach the correct height, overcoming gravity and speed constraints.
        
        You have ten attempts to successfully launch the satellite into orbit. Too steep, too 
        shallow, too slow, or too fast – and you'll fail. Do you have what it takes to succeed?
        """
    )
    
    # Randomly generate the target height (H)
    H = random.randint(1, 100)
    print("YOU MUST LAUNCH A SATELLITE.")
    print(f"TO A HEIGHT OF {H}")
    
    # Loop to give the player 10 attempts
    for G in range(1, 11):
        try:
            # Get the player's input for angle and speed
            A = float(input("ENTER ANGLE (0-90): "))
            V = float(input("ENTER SPEED (0-40000): "))
        except ValueError:
            print("Please enter valid numbers.")
            continue
        
        # Adjust the angle and speed based on the formula
        adjusted_A = A - (math.atan(H / 3) * 180 / math.pi)
        V = V - 3000 * math.sqrt(H / (H + 1))
        
        # Check if the adjusted angle and speed are within range
        if abs(adjusted_A) < 2 and abs(V) < 100:
            # Success
            print("YOU'VE DONE IT!")
            print("ROCKET IS IN ORBIT")
            print("NCTV WINS - THANKS TO YOU")
            
            # Calculate bonus points
            B = int(1000 / G)
            print(f"YOU'VE EARNED A BONUS OF {B} CREDITS!")
            return  # End the game if successful
        
        # Provide feedback based on adjusted angle and speed
        if adjusted_A < -2:
            print("TOO SHALLOW")
        elif adjusted_A > 2:
            print("TOO STEEP")
        
        if V < 100:
            print("TOO SLOW")
        elif V > 100:
            print("TOO FAST")
        
        # If unsuccessful, print failure messages and allow another attempt
        if G == 10:
            print("YOU'VE FAILED")
            print("ROCKET HAS MISFIRED")
            return

# Start the game
intergalactic_games()
