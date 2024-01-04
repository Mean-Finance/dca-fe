/**
................................................................+#**#@#-...........
..............................................................:%@@#+===%@:.........
............................................................-@@#=-======+@=........
.....................................................:.....@%=:-==#===++=+@=.......
...............................................:+@@@%%@@#=%*===-==========##:......
..............................................-@*------+=*@@@@*==+======++*%:......
.............................................*@-=##-=@-#%@@-%@@=++=+#++=*+%*:......
...........................................-%#-*@@@@=#%=@*%@@#====+%@%@@*@#:.......
......................................:=@@@%----@@#-=@+=%#@-+@%@@@@@*==+=:.........
..................................:=@@@@@@@@*---*@%@@#@+:..........................
..............................-+%@@@@@@@@@@@@*@%%+:................................
..........................:=#@@@@@@@@@@@@@@@#:.....................................
.......................-#@@@@@@@@@@@@@@@@+=:.......................................
....................:*@@@@@@@@@@@@@@@@=:.......:...................................
...................%@@@@@@@@@@@@@@@+:.+@%###**#@=..................................
................:@@@@@@@@@@@@@@@@-..+%+**********#*:...............................
..............:*@@@@@@@@@@@@@@@=..-#***************%=..............................
............:-%@@@@@@@@@@@@@@+..+%#@@%%*************#+.............................
............*@@@@@@@@@@@@@@*:...*%@%@@%#%@%#*********%-............................
............#@@@@@@@@@@%@#:....:##@+++++++++=+%@#*##%*+............................
............*@@@@@@@@@#-:.....:*%##--@@@=----------*###............................
............@@@@@@@@@%-.......*%#@+*@#+-*@@=**=--=-=@@:............................
............@@@@@@@@@@+......%#@#@=%..-#-:#+-*#**=+@@%.............................
............@@@@@@@@@@@:...:##@@@%=-#+++=++-=+:#+:*@%*.............................
............@@@@@@@@@@@+..-##@@%@%=--+##=---+*=%+*%%@..............................
............%@@@@@@@@@@@.-##%@#@@@+----=@-----==-=#%+..............................
............*@@@@@@@@@@@%#*%@**@@##----=*=#+@@=--%#@-..............................
............-@@@@@@@@@@@@*#@#*@%@#@*-@%@@%@@=-:-#%##:..............................
............:@@@@@@@@@@@@@%#**@%@%*@+----#@@@#%#%*@*...............................
............:@@@@@@@@@@@@@%**@%#%@**%+-------*#%*#@+...............................
.............+@@@@@@@@@@@@###@@%*@@**##*+=@#@%#%#@@+...............................
.............=@@@@@@@@@@@@*%@%%%**@@***@@@@@###*%*%+...............................
.............-%@@@@@@@@@@@#%@**%***@@***%@%*%#*@#*@*...............................
..............*@@@@@@@@@@@@@@*#@%***#@@@#*#@**@*%*@+...............................
..............=@@@@@@@@@@@@%@**%%#*******%@**%%@**%=...............................
..............-%@@@@@@@@@@@*@@*#@@#****#@****@@#*%*:...............................
..............:%@@@@@@@@@@@#*%@##%@***%%****@@#*@@@@@%+............................
...............*@@@@@@@@@@@%***@%#@@@%#*#%*#@#*@@@@@@@@@-..........................
..............:@@@@@@@@@@@@%**#@#@***#@@**#@#*@@@@@@@@@@%:.........................
..............*@@@@@@@@@@@@@@***#%@@@@****@##@@@@@@@@@@@%..........................
.............:@@@@@@@@@@@@@@@@@@%#*#***%@@*#@@@@@@@@@@@@+..........................
.............+@@@@@@@@@@@@@@@@@@@@@@#****%@@@@@@@@@@@@@%...........................
............:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:...........................
............=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=............................
............@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.............................
...........:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:.............................
...........#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..............................
...........%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-..............................
...........@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#:..............................
...........%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=...............................
...........#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%................................
...........#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=................................
...........=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#:................................
........:+##+:.-%@=..:#@:..-*#+:....++-..:%#-..:####-..............................
.......-#%*###:+#%+..+##..:#%##+...*#%#:.*%#=..###*-...............................
.......=%#-:*+.+#%*==#%#.:*%##%*..:%#%#::###=.=%#=.................................
.......:*%##:..=%%####%+.-##+###..+%#%#-#%##=.#%%%%#:..............................
.........:-#%#:=#%-.:#%-.=%%@#%#-.#@+#%#%*%#=:###:.................................
.......#%*:=%%=:#%-.:#%=:#%*:.#%*.#%-+%%#.##*.#%#--=:..............................
.......:*#%##=..-+:..-=::*%=..:##-*%::*#-.:#+::#####:..............................
**/

export const AAVE_FROZEN_TOKENS: string[] = [
  '0xfa68fb4628dff1028cfec22b4162fccd0d45efb6', // aave-v3 maticx again due to vuln
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // aave-v3 wmatic again due to vuln
];

export const SHAME_LIST = [...AAVE_FROZEN_TOKENS];
