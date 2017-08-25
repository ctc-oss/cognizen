FROM node:argon-alpine

#ARG HTTP_PROXY
#ARG HTTPS_PROXY

ENV http_proxy=http://server41.ctc.com:3128 \
    https_proxy=http://server41.ctc.com:3128

RUN mkdir -p /usr/src/app
COPY ./bin /usr/src/app

WORKDIR /usr/src/app/server
RUN npm install

RUN apk update \
 && apk add bash curl git

RUN npm install https://github.com/stackdot/NodeJS-Git-Server

RUN chown -R root:root /usr/src/app && chmod -R ug+rwX /usr/src/app

COPY docker-run.sh /usr/src/app/server/run.sh
CMD [ "/usr/src/app/server/run.sh" ]
EXPOSE 8080
USER 1001

#ENV COGNIZEN_URL =  http://localhost:8080 \
#    COGNIZEN_MAIL_SERVER = localhost \
#    COGNIZEN_ADMIN_EMAIL = admin@example.com \
#    COGNIZEN_DB_URL = mongodb://localhost:27017/cognizen \
#    COGNIZEN_DB_USERNAME = "" \
#    COGNIZEN_DB_PASSWORD = "" \
#    COGNIZEN_REDMINE_HOST = "" \
#    COGNIZEN_REDMINE_PORT = "" \
#    COGNIZEN_REDMINE_API_KEY = "" \
#    COGNIZEN_REDMINE_PROTOCOL = ""
