FROM node:current-alpine3.16

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apk update && apk upgrade
RUN apk --no-cache add sqlite

RUN addgroup --system --gid 1001 appusergroup \
    && adduser --uid 1001 --system appuser --ingroup appusergroup --disabled-password --shell /bin/bash

USER appuser
WORKDIR /home/appuser
RUN mkdir -p ./app
WORKDIR /home/appuser/app

ADD --chown=appuser:appusergroup ./dist/main.js ./dist/main.js
ADD --chown=appuser:appusergroup ./package*.json ./

RUN npm ci --prod --ignore-scripts
RUN npm rebuild

ENTRYPOINT ["npm", "run", "start:prod"]
