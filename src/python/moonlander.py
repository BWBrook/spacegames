import time

def moonlander():
    """Main function for playing Moonlander."""
    # Clear the screen (this is terminal-dependent, use as appropriate)
    print("\n" * 100)
    
    # Narrative introduction
    print("MOONLANDER")
    print(
        """
        You are at the controls of a lunar module, guiding a small team of astronauts down 
        to the moon’s surface. To land safely, you must slow your descent by burning fuel, 
        but your fuel supply is limited. 

        Try to reach a speed close to zero by the time you touch down. Can you land safely 
        on the moon?
        """
    )
    
    # Initial values
    time_counter = 0
    height = 500
    velocity = 50
    fuel = 120
    
    # Game loop
    while height > 0:
        # Display current status
        print(f"TIME: {time_counter}  HEIGHT: {height}  VEL.: {velocity}  FUEL: {fuel}")
        
        # Display descent star position based on height, with a larger scale factor
        star_position = int(height // 10)  # Adjust scale for more visible movement across the screen
        print(" " * star_position + "*")
        
        # Check if fuel is available for burning
        if fuel > 0:
            # Get burn amount from player
            burn = int(input("BURN? (0-30): "))
            # Enforce burn limits
            burn = max(0, min(burn, 30))
            burn = min(burn, fuel)  # Limit to available fuel
        else:
            print("No fuel left! Freefalling...")
            burn = 0
        
        # Calculate new velocity, apply burn and counter gravity
        new_velocity = velocity - burn + 5
        fuel -= burn
        
        # Check if the lander has reached or passed the surface
        if (new_velocity + velocity) / 2 >= height:
            # Calculate final velocity at landing based on height
            final_velocity = velocity + (5 - burn) * height / velocity
            velocity = final_velocity
            break
        
        # Update height, time, and velocity for the next iteration
        height -= (new_velocity + velocity) / 2
        time_counter += 1
        velocity = new_velocity
        time.sleep(0.5)  # Brief delay for readability
    
    # Final landing check based on final velocity
    if velocity > 5:
        print("YOU CRASHED - ALL DEAD")
    elif 1 < velocity <= 5:
        print("OK - BUT SOME INJURIES")
    else:
        print("GOOD LANDING.")

# Start the game
moonlander()
