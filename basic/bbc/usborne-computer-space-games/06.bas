10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="MONSTERS OF GALACTICON"
40 PROCtitle
50 PRINT"Landing on Galacticon was easy - but    no-one warned you that some of the      nastiest monsters in the known Universe are to be found there."
60 PRINT"  As each monster threatens, you must   choose one of your weapons- a ray gun,  a trypton blaster or a sword laser- to  use against it. Can you make the right  choices? If so, you may live to conquer Galacticon."
70 *FX15,1
80 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
90 CHAIN "06MOG"
100 END
110 DEF PROCtitle
120 PRINT
130 L=LEN(TITLE$)
140 PRINT TAB(20-L/2);TITLE$
150 PRINT TAB(20-L/2);STRING$(L,"_")
160 PRINT
170 ENDPROC
