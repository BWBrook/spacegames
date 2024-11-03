# Computer Spacegames by Daniel Isaaman and Jenny Tyler

## Table of Contents

1. About this Book
2. Starship Takeoff
3. Intergalactic Games
4. Evil Alien
5. Beat the Bug Eyes
6. Moonlander
7. Monsters of Galacticon
8. Alien Snipers
9. Asteroid Belt
10. Trip to the Future
11. Death Valley
12. Space Mines
13. Space Rescue
14. Touchdown: TRS-80 version
15. Touchdown: VIC 20 version
16. Touchdown: ZX81 version
17. Touchdown: ZX Spectrum version
18. Touchdown: BBC version
19. Touchdown: Apple version
20. Adding to the programs
21. Writing your own programs
22. Summary of BASIC
23. Conversion chart
24. Puzzle Answers

# About This Book

This book contains simple games programs to play on a microcomputer. They are written for use on ZX81, ZX Spectrum, BBC, VIC20, TRS-80, and Pet and Apple micros, and many are short enough to fit into the ZX81’s 1K of memory.

Most micros use the language BASIC, but they all have their own variations or dialects. In this book, the main listing for each program works on the ZX81 and lines which need changing for the other computers are marked with symbols and printed underneath. The fact that the programs are written for several micros means that they do not make full use of each one’s facilities. You could try finding ways of making the programs shorter and neater for your micro.

For each game, there are ideas for changing and adding to the programs, and towards the back of the book you will find tips and hints on writing games of your own. Also in the book is a conversion chart to help you adapt programs in magazines and other books for your micro and a summary of the BASIC terms used in this book.

## Typing in the programs

Lines which need changing for computers other than ZX81 are marked with these symbols:

- ▲ VIC and Pet
- ■ BBC and Acorn Electron
- ♦ TRS-80
- ⓐ Apple
- ◆ ZX Spectrum

Every time you see the symbol for the micro you are using, look below for the corresponding line number with the same symbol and type that in instead.

_VIC 20 versions of all except the graphics program should work on PET computers._

### Points to remember

1. Type the lines exactly as they are printed, including all punctuation and spaces.
2. Press RETURN, NEWLINE, or ENTER key at the end of each program line.
3. Check each line as you go.
4. Make sure you don’t miss out a line or confuse one with another. A piece of paper or a ruler is useful to mark your place in the listing.
5. Look out for the symbols and make sure you use the correct lines for your computer.
6. If you are using a ZX81 or ZX Spectrum, remember not to type the program instructions letter by letter but to use the special key for each instruction instead.

You may find it easier to get someone to read the program out to you while you type it in. Don’t forget to explain that they must read every comma, full stop, bracket, and space and differentiate between letter “O” and zero, FOR and 4, and TO and 2.

### Debugging programs

When you have typed in the program, check your manual to find out how to display it on the screen. (Usually you type LIST followed by the line numbers of the section you want to see.)

# Important Notes for Using the Programs

Check you have typed everything correctly. It is easy to make mistakes, so expect to find some. Use your manual to find out how to make changes to the program once it is typed in. If in doubt, you can always type the line again. All the computers will replace an existing line with a new one with the same number.

Here is a checklist of common mistakes to look out for:
1. Line missed out.
2. Line wrongly numbered.
3. The beginning of one line joined onto the end of another.
4. Brackets, commas, colons, semicolons, full stops or spaces missed out, especially in long, complicated lines. Watch for double brackets in particular.
5. Wrong line used for your computer.
6. Letter “O” confused with zero.
7. Wrong numbers used, e.g. extra zeros included.

## Playing the games

To start the game you must type RUN. In some games things happen very quickly, so make sure you have read the instructions and know what you are supposed to do.

It is quite likely that the program still has a mistake in it and either won’t run at all or the game won’t work properly. Sometimes your computer will give you an error code which you can look up in the manual. This may help you find the mistake, though not always. List the program again and check it carefully against the book.

When the game is over, the computer will usually say something like BREAK IN LINE 200. To play again, you have to type RUN.

## Experimenting with the games

There are suggestions for changing and adding to the programs throughout the book, but don’t be afraid to experiment with changes of your own. You can’t damage the computer and you can always change back to the original if the changes don’t work.

You will probably find you want to adjust the speed of some games,* especially after you have played them a number of times. You will find out which line to change on each program page.

Wherever you see `PRINT`, you can change the message in quotes that follows it to whatever you like. Also, unless you have a ZX81 with only 1K, you can add extra messages. 

Type a line number (say 105 if you want to add a message between lines 100 and 110), then type `PRINT`, then your message inside quotes.

If your computer can make colors and sounds, you could use your manual to find out how they work and try adding them to the games in this book.

*See page 37 for a special note for BBC and Spectrum users.

# Game Introductions

## Starship Takeoff

You are a starship captain. You have crashed your ship on a strange planet and must take off again quickly in the alien ship you have captured. The ship’s computer tells you the gravity on the planet. You must guess the force required for a successful take off. If you guess too low, the ship will not lift off the ground. If you guess too high, the ship’s fail-safe mechanism comes into operation to prevent it being burnt up. If you are still on the planet after ten tries, the aliens will capture you.

## Intergalactic Games

There is fierce competition among the world’s TV companies for exclusive coverage of the First Intergalactic Games. Everything depends on which company wins the race to put a satellite into orbit at the right height.

You are the Engineer in charge of the launch for New Century TV. The crucial decisions about the angle and speed of the launching rocket rests on your shoulders. Can you do it?

## Evil Alien

Somewhere beneath you, in deepest, blackest space, lurks Elron, the Evil Alien. You have managed to deactivate all but his short-range weapons, but he can still make his ship invisible.

You know he is somewhere within the three-dimensional grid you can see on your ship’s screen (see below), but where?

You have four space bombs. Each one can be exploded at a position in the grid specified by three numbers between 0 and 9, which your computer will ask you for. Can you blast the Evil Elron out of space before he creeps up and captures you?

## Beat the Bug Eyes

You’re trapped! Everywhere you turn you catch a glimpse of the steely cold light of a space bug’s eyes before it slithers down behind a rock again. Slowly the bugs edge towards you, hemming you in, waiting for a chance to bind you in their sticky web-like extrusions. Luckily you have your proton blaster with you.

The bug eyes pop up in four different places on your screen and these correspond to keys 1 to 4. Press the correct key while the bug’s eyes are on the screen and you will blast it. There are 10 bugs in all—the more you blast, the greater your chance of escape.

## Moonlander

You are at the controls of a lunar module which is taking a small team of astronauts down to the moon’s surface. In order to land safely you must slow down your descent, but that takes fuel and you have only a limited supply.

Your computer will tell you your starting height, speed, and fuel supply and ask how much fuel you wish to burn. It will then work out your new height and speed. A burn of 5 will keep your speed constant. A higher number will reduce it. Try to have your speed as close to zero as you can when you land. Can you land safely on the moon?

## Monsters of Galacticon

Landing on Galacticon was easy – but no one warned you that some of the nastiest monsters in the known Universe are to be found there.

As each monster threatens, you must choose one of three weapons – a ray gun, a trypton blaster, or a sword laser – to use against it. Can you make the right choices? If so, you may live to conquer Galacticon.

