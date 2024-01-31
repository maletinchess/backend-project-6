FROM node:20

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN make build

RUN docker run node:20 make db-migrate

CMD ["bash", "-c", "npm start"]