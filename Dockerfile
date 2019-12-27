FROM node:10.17.0-jessie
WORKDIR /usr/src/app
RUN apt-get update && \
    apt-get install python python-pip git openssl -y
RUN pip install setuptools
RUN pip install -U platformio && \
    pio platform update
COPY package*.json ./
RUN npm i
RUN npm i typescript -g
COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build
RUN rm -rf ./node_modules
RUN rm -rf ./src
RUN npm uninstall typescript -g
RUN rm tsconfig.json
RUN npm i --only=prod
RUN rm package.json
RUN rm package-lock.json
RUN mkdir content
VOLUME [ "/usr/src/app/content" ]
EXPOSE 8266
CMD ["node", "build/index.js"]