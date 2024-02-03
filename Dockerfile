FROM node:20 AS taskmanager

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN make build

RUN sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

RUN sudo docker run hello-world

CMD ["bash", "-c", "make db-migrate && npm start"]