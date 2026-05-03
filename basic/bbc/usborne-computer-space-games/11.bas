10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="SPACE MINES"
40 PROCtitle
50 PRINT"You are the newly elected leader of a   mining colony on the planet Astron.     All decisions concerning the sale of oreto Intergalactic Traders, food purchase and sale and purchase of mines are made"
60 PRINT"by you. Can you keep the people         satisfied and survive your 10 years in  office or will life in the colony end   in disaster under your rule?"
70 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
80 CHAIN "11SM"
90 END
100 DEF PROCtitle
110 PRINT
120 L=LEN(TITLE$)
130 PRINT TAB(20-L/2);TITLE$
140 PRINT TAB(20-L/2);STRING$(L,"_")
150 PRINT
160 ENDPROC
