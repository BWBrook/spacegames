10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="STARSHIP TAKE-OFF"
40 PROCtitle
50 PRINT"You are a starship captain. You have    crashed your ship on a strange planet   and must take off again quickly in the  alien ship you have captured. The ship'scomputer tells you the gravity on the"
60 PRINT"planet. You must guess the force        required for a successful take off. If  you guess too low, the ship will not    lift off the ground. If you guess too   high, the ship's fail-safe mechanism"
70 PRINT"comes into operation to prevent it beingburnt up. If you are still on the       planet after ten tries, the aliens will capture you."
100 *FX15,1
110 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
120 CHAIN "01ST"
130 END
140 DEF PROCtitle
150 PRINT
160 L=LEN(TITLE$)
170 PRINT TAB(20-L/2);TITLE$
180 PRINT TAB(20-L/2);STRING$(L,"_")
190 PRINT
200 ENDPROC
