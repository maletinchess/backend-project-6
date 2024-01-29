FROM node:20

RUN apt-get update && apt-get install -yq \
  build-essential \
  python3

RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN make build

CMD ["bash", "-c", "npm start"]

RUN make db-migrate