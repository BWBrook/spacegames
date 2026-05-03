10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="ALIEN SNIPERS"
40 PROCtitle
50 PRINT"You are the captain of an interstellar  cruiser which, through damage to one of its hyperspace motors, has strayed into a forbidden area. Alien sniper ships areattacking you and, to make things worse,";
60 PRINT"are using a jamming device on your      radar which makes it give false         readings. Luckily your computer knows a code which you can use to work out the"
70 PRINT"correct locations of the enemy ships.   But you must be quick - they don't stay in one place for long!"
80 PRINT"  Your computer will print a letter     (the false enemy location) and a code   number. You must think through the      alphabet by that number of letters and"
90 PRINT"type in the letter you get to."
100 *FX15,1
110 PRINTTAB(1,23);"Press the SPACE BAR to continue.":REPEAT UNTIL GET=32
120 CLS:PROCtitle
130 PRINT"e.g. for M 4, you must type Q, and for  C 2, you must type E and so on."
140 PRINT"Typing in a letter automatically        triggers off your laser gun, so if your letter is correct you'll score a hit.   You can choose the difficulty of the    game. This is a number between 1 and 10"
150 PRINT"and is the maximum number of letters to be added on each time. You get 10 alien snipers each game. See how many you can hit."
160 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
170 CHAIN "07AS"
180 END
190 DEF PROCtitle
200 PRINT
210 L=LEN(TITLE$)
220 PRINT TAB(20-L/2);TITLE$
230 PRINT TAB(20-L/2);STRING$(L,"_")
240 PRINT
250 ENDPROC
