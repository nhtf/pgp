FROM node:19.9 AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM nginx:1.24
COPY --from=build /app/public /usr/share/nginx/html
