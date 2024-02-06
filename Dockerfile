FROM node:20 as firstlayer

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN make build

CMD ["bash", "-c", "make db-migrate"]

FROM node:20

WORKDIR /app

COPY --from=firstlayer /app /app

CMD ["bash", "-c", "npm run start"]