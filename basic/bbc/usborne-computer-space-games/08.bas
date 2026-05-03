10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="ASTEROID BELT"
40 PROCtitle
50 PRINT"You are on a trip through the Asteroid  Belt. To avoid crashing into the        asteroids, you must destroy them and theforce required for doing this depends ontheir size."
60 PRINT"  Asteroids appear on your computer     screen as a group of stars. To destroy  them you must press the number key      corresponding to the number of stars.   Be prepared - asteroids come at you     thick and fast."
70 *FX15,1
80 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
90 CHAIN "08AB"
100 END
110 DEF PROCtitle
120 PRINT
130 L=LEN(TITLE$)
140 PRINT TAB(20-L/2);TITLE$
150 PRINT TAB(20-L/2);STRING$(L,"_")
160 PRINT
170 ENDPROC
