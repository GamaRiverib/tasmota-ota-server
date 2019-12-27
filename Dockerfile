FROM node:10.17.0-alpine
WORKDIR /usr/src/app
RUN apk --update add git less openssh \
        python python-dev py-pip build-base && \
    pip install -U platformio && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*
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