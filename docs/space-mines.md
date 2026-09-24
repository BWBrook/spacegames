# Space Mines

## BASIC Origins
`basic/bbc/usborne-computer-space-games/11.bas` makes you the newly elected leader of a mining colony on the planet Astron, responsible for selling ore to Intergalactic Traders, buying food, and buying and selling mines. "Can you keep the people satisfied and survive your 10 years in office?"

`11SM.bas` founds a colony of 40 to 99 people with 5 to 7 mines, each producing 80 to 119 tons a year, and a satisfaction factor of 1. Each year it rolls an ore price of $7 to $18 a ton and a mine price of $2,000 to $3,999, then asks four questions: how much ore to sell, how many mines to sell, how much to spend on food, and how many mines to buy. At the end of the year, over $120 a head on food raises satisfaction by 0.1 and under $80 cuts it by 0.2. Satisfaction above 1.1 makes the mines more productive and the colony larger; below 0.9 does the reverse; below 0.6 the people revolt. Fewer than ten people a mine and they are overworked; fewer than thirty people and the colony fails. A radioactive leak one year in a hundred halves the population, and a market glut halves production once a mine reaches 150 tons.

## Line 500, and a Shift key
```basic
500 IF S>1.1 THEN LET CE=CE+INT(RND81)*20+1)
```
It should read `RND(1)`. On a BBC Micro keyboard the opening bracket is Shift and 8, so `RND81)` is exactly what the keys produce when the typist misses the Shift. BBC BASIC only checks a statement's syntax when it runs it, and the `THEN` clause only runs when satisfaction is above 1.1, so the listing loads, runs and plays normally until you do well. Then it stops with `Missing ) at line 500`.

**Being a good leader crashes the game.** One generous year takes satisfaction to exactly 1.1, which is safe. The second takes it to 1.2, and the program halts. The consequences run further than the crash:

- **Production can never rise**, because line 500 is the only line that raises it.
- **The population can never grow**, because line 530, which grows it, sits behind the same test and is never reached.
- **The market glut can never happen**, because production cannot climb to 150 tons.

What is left is a game about not rocking the boat. Simulating 40,000 runs, a strategy that feeds generously and buys mines halts at line 500 in two runs out of three. The same strategy on the repaired rules survives 64 per cent of the time and ends its term with about 94 people, against 58 for a cautious leader.

## What the arithmetic rewards
- **$80 a head is the real floor.** The prompt suggests "APPR. $100 EA.", but nothing between $80 and $120 changes anything. Feeding at exactly $80 and holding ore back in years when the price is poor survives 79 per cent of the time; feeding at $100 survives 66 per cent. The difference goes on food nobody needed.
- **Satisfaction never wears off.** It only moves when spending crosses a threshold. Under the repaired rules, two generous years buy growth every year for the rest of the term, and $80 a head keeps it.
- **Ore keeps.** Nothing spoils in the store, so the skill is selling in good years and holding in bad ones. The price varies by a factor of more than two from year to year.

## Other quirks
- **One start in three is already overworked.** With 40 to 99 people and 5 to 7 mines, 33 per cent of new colonies have fewer than ten people a mine. Unless you sell mines in the first year you lose at its end, and nothing tells you.
- **Selling every mine divides by zero.** Line 310 allows it, and line 520 then divides the population by the number of mines: `Division by zero at line 520`.
- **Falling production can freeze the game.** Production drops each year satisfaction is below 0.9 and nothing stops it going below zero. Once it does, the ore store goes negative and line 260 rejects every possible answer, so the ore prompt repeats for ever. It happens in about three runs in a hundred for a leader who skimps once and then spends moderately.
- **You never see the disasters happen.** The leak and glut messages print at the end of a year and line 110 clears the screen immediately afterwards. The first sign of a leak is half your people missing next year.
- **A food price is rolled and never used.** Line 40 sets `FP`; nothing reads it.
- **`THERRE ARE`** is misspelt on line 140, and on a BBC the year prints as `YEAR1`, because BBC BASIC puts no space before a positive number where the Microsoft BASICs of the day did.
- **Fractions are allowed.** You can sell half a ton of ore or buy half a mine.
- **There is no score.** Surviving is the whole goal; money left over counts for nothing.

## Retro BASIC Lane
A prompt loop on `RetroTerminal`, faithful to the disk: the screen and its typo, the four prompts with their re-asks, BBC `INPUT` reading a blank line as 0, every end-of-year rule in the listing's order, the syntax error at line 500, the division by zero at line 520, the endless ore prompt, the leak and glut messages cleared before they can be read, and nine-significant-figure numbers. Satisfaction uses ordinary floating point; where a run of stingy budgets tips into revolt could differ by a year from a real BBC, whose 40-bit floats round differently near 0.6.

Verified by script: the opening screen reads `YEAR1` and `THERRE ARE`; an over-large answer reprints its prompt; one generous year leaves satisfaction at 1.1 and the second stops the program with `Missing ) at line 500`; selling every mine stops it with `Division by zero at line 520`; an overworked start that sells nothing ends in `YOU'VE OVERWORKED EVERYONE`; three stingy years end in `THE PEOPLE REVOLTED`; and a frugal term at $80 a head survives.

## Reimagined Lane
- **The intended rules.** Line 500 works, so a happy colony grows, its mines improve, and gluts arrive once production passes 150 tons. The disk's other hazards are closed: no mines means no ore rather than a division by zero, and production stops at zero.
- **A colony you can see.** A headframe for every mine, a dome for every dozen people with lights that dim as satisfaction falls, and an ore heap that grows in the store.
- **The rules on the page.** As you set the orders, the lane says what they will do: money left, whether food holds, raises or cuts satisfaction, people per mine with a warning below ten, and whether the colony will grow, hold or shrink. The listing gave none of this; the challenge becomes planning against the market, not guessing thresholds.
- **Food by the head.** The listing asked for a total and compared it per head; the lane asks per head directly.
- **The market's history.** A strip of this term's ore prices against the full range the listing can roll, so selling in good years and holding in bad is a decision rather than a guess.
- **A year-end report** of what the traders paid, what was spent, and what changed, with the leak and glut shown rather than cleared away.
- **A score and a rank** at the end of the term, by population, from Caretaker to Founder of Astron.

## Playtest Notes
Verified by script on 24 September 2026: the retro checks above; and in the reimagined lane, orders costing more than the colony has are refused, while a strategy of buying happiness twice and then coasting at $80 a head survived three terms out of three and grew the colony from 70 people to between 114 and 121.

Open questions for a human. Whether showing the thresholds makes the game too easy, when the original's appeal may have been discovering them. Whether ten years is long enough for the growth strategy to feel earned. And whether typing numbers into a canvas form feels natural or would be better as real form fields.
