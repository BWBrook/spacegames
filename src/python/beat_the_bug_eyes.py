import random
import time

def beat_the_bug_eyes():
    """Main function for playing Beat the Bug Eyes."""
    # Clear the screen (this is terminal-dependent, use as appropriate)
    print("\n" * 100)
    
    # Narrative introduction
    print("BEAT THE BUG EYES")
    print(
        """
        You're trapped in a dark corner of space, and the terrifying bug eyes keep popping up, 
        staring at you from the darkness. You must blast each bug eye as soon as it appears on 
        your screen before it slithers back out of reach.

        You have a proton blaster assigned to four positions (keys 1-4), and each bug will 
        appear randomly in one of these spots. Press the correct key as quickly as possible to 
        zap it!

        Blast as many as you can out of 10 bugs to maximize your chance of escape.
        """
    )
    
    # Choose difficulty settings
    while True:
        try:
            speed = int(input("Choose speed level (1 = Fast, 2 = Medium, 3 = Slow): "))
            if speed in [1, 2, 3]:
                break
            else:
                print("Please choose 1, 2, or 3.")
        except ValueError:
            print("Please enter a valid number (1, 2, or 3).")
    
    delay_times = {1: 0.5, 2: 1, 3: 1.5}  # Delay time based on speed choice
    delay_time = delay_times[speed]
    
    while True:
        try:
            positions = int(input("Choose number of bug positions (4 or 8): "))
            if positions in [4, 8]:
                break
            else:
                print("Please choose 4 or 8.")
        except ValueError:
            print("Please enter a valid number (4 or 8).")
    
    # Initialize game variables
    score = 0
    total_turns = 10
    
    # Main game loop for 10 turns
    for t in range(total_turns):
        print("\n" * 100)  # Clear screen for each turn
        
        # Random delay for suspense
        time.sleep(random.uniform(delay_time, delay_time + 0.5))
        
        # Choose a random position for the bug to appear
        bug_position = random.randint(1, positions)
        
        # Show bug eyes at a specific position
        print(f"Bug Eyes appear at position {bug_position}! 00==----")
        
        # Wait for player's input within a limited time window
        start_time = time.time()
        input_received = False
        while time.time() - start_time < delay_time:
            try:
                # Get user input as an integer
                player_input = int(input("Press the position number (1 to 4 or 8): "))
                input_received = True
                break
            except ValueError:
                # Ignore non-integer input
                pass
        
        # Check if the player input matches the bug's position
        if input_received and player_input == bug_position:
            print("*BLAST!* You hit it!")
            score += 1
        else:
            print("Missed it!")
        
        # Brief delay before clearing for next turn
        time.sleep(1)
    
    # End of game and display score
    print(f"\nGAME OVER! You blasted {score} out of {total_turns} bugs.")

# Start the game
beat_the_bug_eyes()
