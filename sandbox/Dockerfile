FROM node:16.17.1

WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN yarn install
COPY . .
CMD yarn start
