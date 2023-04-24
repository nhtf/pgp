FROM node:19.9

COPY . /home/node/app
WORKDIR /home/node/app

RUN npm install
RUN npm run build
RUN chown -R node:node avatar

EXPOSE 3000
ENTRYPOINT ["npm", "run", "start:prod"]
