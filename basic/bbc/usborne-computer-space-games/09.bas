10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="TRIP INTO THE FUTURE"
40 PROCtitle
50 PRINT"Imagine you are in a spaceship          travelling nearly as fast as light.     Strangely time is passing more slowly   inside your spaceship than outside. So, having set off on a long, fast space"
60 PRINT"trip, you can return to Earth further inthe future than the clocks inside your  ship indicate."
70 PRINT"  In this game, your computer tells you how many years must elapse on Earth     before you return."
80 PRINT"You then decide the length of your trip (in light years) and the speed of your  ship (as a fraction of the speed of     light) in order to achieve this."
90 PRINT"Take care not to travel too slowly or   you will die of old age on the way."
100 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
110 CHAIN "09TITF"
120 END
130 DEF PROCtitle
140 PRINT
150 L=LEN(TITLE$)
160 PRINT TAB(20-L/2);TITLE$
170 PRINT TAB(20-L/2);STRING$(L,"_")
180 PRINT
190 ENDPROC
