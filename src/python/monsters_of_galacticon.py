import random

def monsters_of_galacticon():
    """Main function for playing Monsters of Galacticon."""
    # Clear the screen (terminal-dependent, adjust as necessary)
    print("\n" * 100)
    
    # Narrative introduction
    print("MONSTERS OF GALACTICON")
    print(
        """
        You have landed on the planet Galacticon, only to discover that it is infested with 
        deadly monsters. To survive, you must defeat each monster using the right weapon.

        Each monster requires a specific weapon to defeat it. Choose carefully!
        Weapons:
        - R: Ray Gun
        - S: Sword Laser
        - T: Trypton Blaster

        Good luck on your mission to conquer Galacticon!
        """
    )
    
    # Set up initial values
    monsters = ["SULFACIDOR", "FLAMGONDAR", "BALNOLOTIN", "GOLANDOR"]
    random.shuffle(monsters)  # Shuffle monsters for random encounters
    group_members = 5  # Number of people in the player's group
    encounters = 8  # Number of monster encounters
    weapon_codes = {'R': 1, 'S': 2, 'T': 3}
    
    # Game loop for each encounter
    for encounter in range(encounters):
        if group_members < 1:
            print("YOU'RE ALL DEAD")
            return  # End game if all group members are lost

        # Select a random monster
        monster = random.choice(monsters)
        R = monsters.index(monster) + 1  # Monster index starting from 1

        # Display monster encounter
        print("\nA monster is approaching...")
        print(f"IT'S A {monster}!")
        
        # Prompt player for weapon choice
        while True:
            weapon_choice = input("WHICH WEAPON? (R, S, or T): ").upper()
            if weapon_choice in ['R', 'S', 'T']:
                break
            else:
                print("Invalid choice! Please choose R, S, or T.")

        # Calculate weapon code
        weapon_code = weapon_codes[weapon_choice]
        W = ((weapon_code + R - 1) % 3) + 1

        # Determine outcome based on W
        if W == 2:
            print("YOU'VE KILLED IT!")
        elif W == 3:
            print("NO EFFECT")
            if random.random() > 0.4:
                print(f"YOU ANGERED THE {monster}, AND IT KILLED ONE OF YOUR GROUP")
                group_members -= 1
        else:
            print("NO USE. IT'S EATEN ONE OF YOUR GROUP")
            group_members -= 1

        # Check if group has been wiped out
        if group_members < 1:
            print("YOU'RE ALL DEAD")
            return  # End game

        # Short delay to simulate pause between encounters
        for _ in range(20):
            pass  # Delay loop (adjustable as needed)
    
    # If the player survives all encounters
    print("YOU HAVE SURVIVED TO CONQUER GALACTICON")

# Start the game
monsters_of_galacticon()
