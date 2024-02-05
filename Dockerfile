FROM node:20

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN make build

ENTRYPOINT ["make db-migrate", "npm start"]