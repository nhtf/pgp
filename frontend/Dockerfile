FROM node:19.9 AS build

ARG SSL
ARG FRONTEND_ADDRESS
ARG BACKEND_ADDRESS
ARG BOUNCER_ADDRESS

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

RUN echo FRONTEND_ADDRESS

FROM nginx:1.24
COPY --from=build /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
