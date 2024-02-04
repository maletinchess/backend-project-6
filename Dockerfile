FROM node:20 AS taskmanager

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN make build

RUN docker images

CMD ["bash", "-c", "make db-migrate && npm start"]