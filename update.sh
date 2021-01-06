# Updates on local machine

DOCKER_PID=$(echo $(docker ps -aqf name="pressfbot") | sed 's/\=//')

docker stop $DOCKER_PID
docker rm $DOCKER_PID
docker build . -t pressfbot:latest
docker run --name pressfbot -d pressfbot:latest
