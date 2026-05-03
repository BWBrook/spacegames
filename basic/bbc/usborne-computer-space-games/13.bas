10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="TOUCHDOWN"
40 PROCtitle
50 PRINT"Ace space pilot, Captain Flash, is      sitting next to you as you take the     final part of your Advanced Spacecraft  Handling Test (Part III)."
60 PRINT"Your lightweight, two-man landing craft is rapidly approaching the Moon's       surface. Your velocity must be almost   zero as you touch down."
65 PRINT"Deftly you control the thrust, presing Ato increase it and D to decrease it,    watching your progress on the screen allthe time."
67 PRINT"If you use too much thrust you will     begin to go back up again. Too little   and you will make a new crater on the   Moon. Can you impress Captain Flash     with your skill?"
70 *FX15,1
80 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
90 CHAIN "13T"
100 END
110 DEF PROCtitle
120 PRINT
130 L=LEN(TITLE$)
140 PRINT TAB(20-L/2);TITLE$
150 PRINT TAB(20-L/2);STRING$(L,"_")
160 PRINT
170 ENDPROC
