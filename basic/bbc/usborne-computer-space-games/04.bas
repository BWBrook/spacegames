10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="BEAT THE BUG EYES"
40 PROCtitle
50 PRINT"You're trapped! Everywhere you turn you catch a glimpse of the steely cold lightof a space bug's eyes before it slithersdown behind a rock again. Slowly the    bugs edge towards you, hemming you in,"
60 PRINT"waiting for a chance to bind you in     their sticky web-like extrusions.       Luckily you have your proton blaster    with you."
70 PRINT"  The bug eyes pop up in four different places on your screen and these         correspond to keys 1 to 4. Press the    correct key while the bug's eyes are on"
80 PRINT"the screen and you will blast it. There are 10 bugs in all - the more you blast,the greater your chance of escape."
90 *FX15,1
100 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
110 CHAIN "04BE"
120 END
130 DEF PROCtitle
140 PRINT
150 L=LEN(TITLE$)
160 PRINT TAB(20-L/2);TITLE$
170 PRINT TAB(20-L/2);STRING$(L,"_")
180 PRINT
190 ENDPROC
