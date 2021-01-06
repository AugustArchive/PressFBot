FROM alpine:latest

LABEL MAINTAINER="Chris \"August\" Hernandez"
RUN apk add --no-cache --update nodejs-current npm

WORKDIR /opt/PressFBot
COPY . .
RUN npm ci
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]
