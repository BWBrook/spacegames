10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="MOONLANDER"
40 PROCtitle
50 PRINT"You are at the controls of a lunar      module which is taking a small team of  astronauts down to the moon's surface.  In order to land safely you must slow"
60 PRINT"down your descent, but that takes fuel  and you have only a limited supply."
70 PRINT"  Your computer will tell you your      starting height, speed and fuel supply  and ask how much fuel you wish to burn. It will then work out your new height   and speed. A burn of 5 will keep your"
80 PRINT"speed constant. A higher number will    reduce it. Try to have your speed as    close to zero as you can when you land. Canyouland safely on the moon?"
90 *FX15,1
100 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
110 CHAIN "05ML"
120 END
130 DEF PROCtitle
140 PRINT
150 L=LEN(TITLE$)
160 PRINT TAB(20-L/2);TITLE$
170 PRINT TAB(20-L/2);STRING$(L,"_")
180 PRINT
190 ENDPROC
