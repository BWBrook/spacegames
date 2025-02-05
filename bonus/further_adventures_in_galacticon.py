import random
import os

# Clear the screen function
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

# ASCII Art for monsters (simplified for demonstration)
monster_art = {
    "SULFACIDOR": """
      ___
     /   \\
    | RIP |
     \\___/
    """,
    "FLAMGONDAR": """
      /\\_/\\
     ( o.o )
      > ^ <
    """,
    "BALNOLOTIN": """
      .-=-.
     /  !  \\
     |-----|
     \\_____/
    """,
    "GOLANDOR": """
      /-----\\
     |  O O  |
     |   ^   |
     | \\___/ |
      \\_____/
    """,
    "ZARGOTH": """
      /\\
     /  \\
    | STOP |
     \\    /
      \\__/
    """,
    "NEBULON": """
     [-----]
     | (*) |
     |-----|
    """,
}

# Monster data
monsters = [
    {"name": "SULFACIDOR", "weakness": "R", "damage": 2, "xp": 10},
    {"name": "FLAMGONDAR", "weakness": "S", "damage": 2, "xp": 15},
    {"name": "BALNOLOTIN", "weakness": "T", "damage": 3, "xp": 20},
    {"name": "GOLANDOR", "weakness": "P", "damage": 4, "xp": 25},
    {"name": "ZARGOTH", "weakness": "L", "damage": 5, "xp": 30},
    {"name": "NEBULON", "weakness": "B", "damage": 3, "xp": 20},
    # Add more monsters as desired
]

# Weapons data
weapons = {
    "R": {"name": "Ray Gun", "power": 2},
    "S": {"name": "Sword Laser", "power": 3},
    "T": {"name": "Trypton Blaster", "power": 4},
    "P": {"name": "Photon Cannon", "power": 5},
    "L": {"name": "Laser Whip", "power": 4},
    "B": {"name": "Bio Grenade", "power": 3},
    # Add more weapons as desired
}

# Player data
player = {
    "hp": 10,
    "xp": 0,
    "level": 1,
    "inventory": ["R", "S", "T"],  # Starting weapons
    "group_members": 5,
}

# Experience required for leveling up
level_up_xp = [0, 20, 50, 90, 140]  # XP thresholds for levels 1 to 5

def level_up():
    """Checks if player has enough XP to level up and increases level."""
    while player["level"] < len(level_up_xp) and player["xp"] >= level_up_xp[player["level"]]:
        player["level"] += 1
        player["hp"] += 5  # Increase health on level up
        print(f"\nCongratulations! You've reached Level {player['level']}!")
        print("Your health has increased.")
        input("Press Enter to continue...")

def random_event():
    """Generates a random event that can help or harm the player."""
    events = [
        {"type": "find_item", "item": "P", "message": "You found a Photon Cannon!"},
        {"type": "find_item", "item": "L", "message": "You discovered a Laser Whip!"},
        {"type": "heal", "amount": 3, "message": "You found a medkit and restored 3 HP!"},
        {"type": "trap", "damage": 2, "message": "You fell into a trap and lost 2 HP!"},
        {"type": "nothing", "message": "Nothing happened."},
    ]
    event = random.choice(events)
    print("\nRandom Event:")
    print(event["message"])
    if event["type"] == "find_item":
        if event["item"] not in player["inventory"]:
            player["inventory"].append(event["item"])
            print(f"You added {weapons[event['item']]['name']} to your inventory.")
    elif event["type"] == "heal":
        player["hp"] += event["amount"]
    elif event["type"] == "trap":
        player["hp"] -= event["damage"]
    input("Press Enter to continue...")

def encounter_monster():
    """Handles a monster encounter."""
    monster = random.choice(monsters)
    monster_name = monster["name"]
    weakness = monster["weakness"]
    damage = monster["damage"]
    xp_reward = monster["xp"]

    clear_screen()
    print(f"A monster is approaching...")
    print(f"IT'S A {monster_name}!")
    print(monster_art.get(monster_name, ""))

    # Show player's current stats
    print(f"Your HP: {player['hp']}")
    print(f"Group Members: {player['group_members']}")
    print(f"Available Weapons: {[weapons[w]['name'] for w in player['inventory']]}")

    # Prompt player for weapon choice
    while True:
        weapon_choice = input("WHICH WEAPON WILL YOU USE? (Type the first letter): ").upper()
        if weapon_choice in player["inventory"]:
            break
        else:
            print("Invalid choice or weapon not in inventory. Try again.")

    # Determine outcome
    if weapon_choice == weakness:
        print(f"\nYOU'VE KILLED THE {monster_name}!")
        player["xp"] += xp_reward
        level_up()
    else:
        # Chance for no effect or taking damage
        if random.random() > 0.5:
            print("\nNO EFFECT!")
            if random.random() > 0.4:
                print(f"THE {monster_name} ATTACKED YOU AND CAUSED {damage} DAMAGE!")
                player["hp"] -= damage
                if player["hp"] <= 0:
                    print("YOU HAVE BEEN DEFEATED!")
                    return False  # Player is dead
        else:
            print(f"\nNO USE. THE {monster_name} HAS EATEN ONE OF YOUR GROUP!")
            player["group_members"] -= 1
            if player["group_members"] < 1:
                print("ALL YOUR GROUP MEMBERS ARE DEAD!")
                return False  # Game over
    input("Press Enter to continue...")
    return True  # Continue the game

def main_game():
    """Main function for 'Further Adventures in Galacticon'."""
    clear_screen()
    # Introduction
    print("FURTHER ADVENTURES IN GALACTICON")
    print(
        """
        You continue your quest on the treacherous planet Galacticon. The dangers have increased,
        and new monsters lurk in every corner. Equip yourself, manage your resources, and lead your
        group to conquer Galacticon once and for all!

        Good luck, brave adventurer!
        """
    )
    input("Press Enter to begin your adventure...")

    # Game loop
    stages = ["The Dark Forest", "The Acid Swamps", "The Crystal Caves", "The Lava Plains"]
    for stage in stages:
        clear_screen()
        print(f"Entering: {stage}")
        input("Press Enter to continue...")
        encounters = random.randint(2, 4)  # Random number of encounters per stage

        for _ in range(encounters):
            # Randomly decide between a monster encounter or random event
            if random.random() > 0.3:
                # Monster encounter
                if not encounter_monster():
                    print("\nGAME OVER")
                    return  # Player died or game over
            else:
                # Random event
                random_event()
                if player["hp"] <= 0:
                    print("\nYou succumbed to your injuries.")
                    print("GAME OVER")
                    return  # Player died

            # Check if player is still alive
            if player["hp"] <= 0:
                print("\nYou have no health left.")
                print("GAME OVER")
                return  # Player died
            if player["group_members"] < 1:
                print("\nYou have no group members left.")
                print("GAME OVER")
                return  # Game over

    # Victory message
    clear_screen()
    print("CONGRATULATIONS!")
    print("YOU HAVE SURVIVED THE FURTHER ADVENTURES IN GALACTICON!")
    print(f"Your final level: {player['level']}")
    print(f"Total experience points: {player['xp']}")
    print("The planet is now safe, thanks to your bravery.")
    input("Press Enter to conclude your adventure...")

# Start the game
if __name__ == "__main__":
    main_game()
