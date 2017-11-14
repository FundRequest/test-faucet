FROM node:9

WORKDIR /app
COPY package.json /app
RUN npm install
COPY contract.json /app
COPY index.js /app

EXPOSE 8080
ENTRYPOINT ["node", "index.js"]