import os
import time

# Data for celestial bodies
celestial_bodies = {
    "Moon": {
        "gravity": 1.62,       # m/s^2
        "atmosphere": False,
        "initial_height": 500, # meters
        "initial_velocity": 50, # m/s
        "initial_fuel": 120     # arbitrary units
    },
    "Mars": {
        "gravity": 3.71,
        "atmosphere": True,
        "atmospheric_density": 0.02,  # kg/m^3 (very thin atmosphere)
        "initial_height": 700,
        "initial_velocity": 60,
        "initial_fuel": 150
    },
    "Earth": {
        "gravity": 9.81,
        "atmosphere": True,
        "atmospheric_density": 1.225,  # kg/m^3 (at sea level)
        "initial_height": 1000,
        "initial_velocity": 80,
        "initial_fuel": 200
    },
    "Venus": {
        "gravity": 8.87,
        "atmosphere": True,
        "atmospheric_density": 65,     # kg/m^3 (very dense atmosphere)
        "initial_height": 1000,
        "initial_velocity": 80,
        "initial_fuel": 250
    },
    "Mercury": {
        "gravity": 3.7,
        "atmosphere": False,
        "initial_height": 600,
        "initial_velocity": 55,
        "initial_fuel": 140
    }
    # Add more celestial bodies as needed
}

def select_celestial_body():
    """Allows the player to select a celestial body to land on."""
    print("Select a celestial body to land on:")
    for index, body in enumerate(celestial_bodies.keys(), start=1):
        print(f"{index}. {body}")
    while True:
        try:
            choice = int(input("Enter the number of your choice: "))
            if 1 <= choice <= len(celestial_bodies):
                selected_body = list(celestial_bodies.keys())[choice - 1]
                return selected_body
            else:
                print("Please select a valid number from the list.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def solar_system_lander():
    """Main function for the solar system landing simulation."""
    # Clear the screen
    os.system('cls' if os.name == 'nt' else 'clear')

    # Introduction
    print("SOLAR SYSTEM LANDER")
    print(
        """
        Welcome to the Solar System Lander simulation!

        You are at the controls of a landing module, guiding a small team of astronauts down 
        to the surface of a celestial body. To land safely, you must slow your descent by 
        burning fuel, but your fuel supply is limited.

        Different planets and moons have varying gravity and atmospheric conditions, which will
        affect your landing. Choose your destination wisely and adjust your strategy accordingly.

        Can you achieve a safe landing?
        """
    )
    input("Press Enter to start the mission...")

    # Select celestial body
    selected_body = select_celestial_body()
    body_data = celestial_bodies[selected_body]

    # Extract data
    gravity = body_data["gravity"]
    atmosphere = body_data.get("atmosphere", False)
    atmospheric_density = body_data.get("atmospheric_density", 0)
    height = body_data["initial_height"]
    velocity = body_data["initial_velocity"]
    fuel = body_data["initial_fuel"]
    time_counter = 0

    # Set drag coefficient (arbitrary value for simulation purposes)
    drag_coefficient = 0.5  # For simplicity, we use a constant value

    # Game loop
    while height > 0:
        # Clear the screen
        os.system('cls' if os.name == 'nt' else 'clear')

        # Display current status
        print(f"LANDING ON: {selected_body.upper()}")
        print(f"TIME: {time_counter} s  HEIGHT: {height:.2f} m  VEL.: {velocity:.2f} m/s  FUEL: {fuel}")
        
        # Display descent star position based on height
        max_height = body_data["initial_height"]
        star_position = int((height / max_height) * 50)  # Scale to fit within 50 characters
        print(" " * star_position + "*")

        # Check if fuel is available for burning
        if fuel > 0:
            # Get burn amount from player with input validation
            while True:
                try:
                    burn = int(input("BURN? (0 - 100): "))
                    burn = max(0, min(burn, 100, fuel))  # Clamp burn value
                    break
                except ValueError:
                    print("Invalid input. Please enter an integer between 0 and 100.")
        else:
            print("No fuel left! Descending without thrust...")
            burn = 0
            time.sleep(1)  # Brief pause to inform the player

        # Calculate acceleration due to gravity and thrust
        thrust_acceleration = burn / 10  # Simplified thrust-to-acceleration conversion
        net_acceleration = gravity - thrust_acceleration  # Net acceleration affecting the lander

        # Atmospheric drag (if applicable)
        if atmosphere:
            drag_force = 0.5 * atmospheric_density * velocity ** 2 * drag_coefficient
            drag_acceleration = drag_force / 1000  # Simplify mass to 1000 kg
            net_acceleration += drag_acceleration
        else:
            drag_acceleration = 0

        # Update velocity and position
        new_velocity = velocity + net_acceleration
        average_velocity = (velocity + new_velocity) / 2
        height -= average_velocity
        fuel -= burn
        time_counter += 1

        # Update velocity for next iteration
        velocity = new_velocity

        # Check for landing or crash
        if height <= 0:
            # Adjust height and calculate final velocity upon impact
            height = 0
            final_velocity = velocity
            break

        time.sleep(0.5)  # Brief delay for readability

    # Final landing check based on final velocity
    print("\nLanding sequence initiated...\n")
    print(f"Final velocity upon impact: {abs(final_velocity):.2f} m/s")

    # Determine outcome
    safe_landing_speed = 5  # Safe landing threshold in m/s
    if abs(final_velocity) > safe_landing_speed * 2:
        print("YOU CRASHED - ALL DEAD")
    elif safe_landing_speed < abs(final_velocity) <= safe_landing_speed * 2:
        print("OK - BUT SOME INJURIES")
    else:
        print("GOOD LANDING.")

# Start the game
if __name__ == "__main__":
    solar_system_lander()
