FROM node:17.6-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${$NODE_ENV}

RUN addgroup --system --gid 1001 appusergroup \
    && adduser --uid 1001 --system appuser --ingroup appusergroup --disabled-password --shell /bin/bash

USER appuser
WORKDIR /home/appuser
RUN mkdir -p ./app
WORKDIR /home/appuser/app

ADD --chown=appuser:appusergroup ./dist/main.js ./main.js
ADD --chown=appuser:appusergroup ./package*.json ./

ENTRYPOINT ["node", "./main"]
