# ur mom gay lmaoooo

compile() {
  echo "building project uwu"
  ./gradlew build
}

moveConfig() {
  cp config.json build/libs/config.json
  echo 'idk m8 the config.json file should be there or u did a fucky wucky'
}

clearJar() {
  rm build/libs/FBot-*.jar
  echo 'cleaned jar file idk'
}

echo 'hi why r u doing this to urself'

compile
moveConfig
clearJar
cd build/libs