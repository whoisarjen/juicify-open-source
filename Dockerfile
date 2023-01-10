FROM node:19-alpine3.16

ENV PORT 3000

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json /usr/src/app/
COPY node_modules /usr/src/app/node_modules

RUN npm install

COPY . /usr/src/app

RUN npx prisma generate

EXPOSE 3000