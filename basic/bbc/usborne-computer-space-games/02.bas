10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="INTERGALACTIC GAMES"
40 PROCtitle
50 PRINT"There is fierce competition among the   world's TV companies for exclusive      coverage of the First Intergalactic     Games. Everything depends on which"
60 PRINT"company wins the race to put a satelliteinto orbit at the right height."
70 PRINT"  You are the engineer in charge of the launch for New Century TV. The crucial  decisions about the angle and speed of  the launching rocket rests on your    shoulders. Can you do it?"
100 *FX15,1
110 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
120 CHAIN "02IG"
130 END
140 DEF PROCtitle
150 PRINT
160 L=LEN(TITLE$)
170 PRINT TAB(20-L/2);TITLE$
180 PRINT TAB(20-L/2);STRING$(L,"_")
190 PRINT
200 ENDPROC
