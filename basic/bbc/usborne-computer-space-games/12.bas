10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="SPACE RESCUE"
40 PROCtitle
50 PRINT"You must make an urgent trip across the spiral arm of the Galaxy to a           developing planet which is in need of   medical supplies. The trip involves suchhuge distances that for most of it you"
60 PRINT"will be in a deep sleep, but before thisyou must program the ship for the       journey. The computer will ask how much energy you want to allocate to the      engines, life support system and shields";
70 PRINT"and then put you to sleep."
80 PRINT"  When you wake up, it will give you a  report on what happened during the trip and, if all went well, you will be      orbiting the planet."
90 *FX15,1
100 PRINTTAB(1,23);"Press the SPACE BAR to continue.":REPEAT UNTIL GET=32
110 CLS:PROCtitle
120 PRINT"You must now allocate your remaining    energy to the landing boosters and"
130 PRINT"shields in order to make a good landing on the planet."
140 PRINT"  If you accomplish the mission safely, you stand a good chance of being        promoted to Space Admiral. Good luck!"
150 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
160 CHAIN "12SR"
170 END
180 DEF PROCtitle
190 PRINT
200 L=LEN(TITLE$)
210 PRINT TAB(20-L/2);TITLE$
220 PRINT TAB(20-L/2);STRING$(L,"_")
230 PRINT
240 ENDPROC
