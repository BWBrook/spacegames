10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="EVIL ALIEN"
40 PROCtitle
50 PRINT"Somewhere beneath you, in deepest,      blackest space, lurks Elron, the Evil   Alien. You have managed to deactivate   all but his short-range weapons but he"
60 PRINT"can still make his ship invisible.      You know he is somewhere within the     three-dimensional grid you can see on   your ship's screen (see below), but     where?"
70 PRINT"You have four space bombs. Each one can be exploded at a position in the grid   specified by three numbers between      0 and 9, which your computer will ask"
80 PRINT"you for. Can you blast the Evil Elron   out of space before he creeps up and    captures you?"
90 *FX15,1
100 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
110 CHAIN "03EA"
120 END
130 DEF PROCtitle
140 PRINT
150 L=LEN(TITLE$)
160 PRINT TAB(20-L/2);TITLE$
170 PRINT TAB(20-L/2);STRING$(L,"_")
180 PRINT
190 ENDPROC
