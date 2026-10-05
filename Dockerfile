FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
