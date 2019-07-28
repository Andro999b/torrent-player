FROM node:10

WORKDIR /usr/app

COPY server/package.json ./

RUN npm install

COPY server .
COPY resources resources
COPY client/dist client

ENV HOST ''
#external port
ENV WEB_PORT '80' 
#internal port
ENV PORT '80'

EXPOSE $PORT

CMD node /usr/app/index.js --no-dlna --no-torrents-providers --no-transcoding --internal-web-port $PORT --web-port $WEB_PORT --hostname $HOST