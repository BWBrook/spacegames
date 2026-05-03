10 MODE 7
20 VDU23;8202;0;0;0;
30 TITLE$="DEATH VALLEY"
40 PROCtitle
50 PRINT"There is only one way to escape the     forces of the evil Dissectitrons.       You will have to steel every nerve and  fly your single-seater Speed Dart along"
60 PRINT"the jagged, bottomless ravine known as  Death Valley."
65 PRINT"  Your computer will ask you for the    width of the valley. Try 15 first and   then work your way down- 8 is quite     difficult. Steer your Speed Dart by"
67 PRINT"pressing Q to go left and P to go right,and see if you can make it safely       through Death Valley."
100 PRINTTAB(1,23);"Press the SPACE BAR to play the game.":REPEAT UNTIL GET=32
110 CHAIN "10DV"
120 END
130 DEF PROCtitle
140 PRINT
150 L=LEN(TITLE$)
160 PRINT TAB(20-L/2);TITLE$
170 PRINT TAB(20-L/2);STRING$(L,"_")
180 PRINT
190 ENDPROC
