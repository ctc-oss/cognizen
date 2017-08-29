FROM node:argon-alpine

RUN mkdir -p /usr/src/app
COPY ./bin /usr/src/app

WORKDIR /usr/src/app/server
RUN mkdir -p /usr/src/app/server/repos

RUN npm install

RUN apk update \
 && apk add bash curl git

RUN chown -R root:root /usr/src/app && chmod -R ug+rwX /usr/src/app

COPY docker-run.sh /usr/src/app/server/run.sh
CMD [ "/usr/src/app/server/run.sh" ]
EXPOSE 8080
USER 1001

ENV COGNIZEN_URL=http://localhost:8080 \
    COGNIZEN_MAIL_SERVER=localhost \
    COGNIZEN_ADMIN_EMAIL=admin@example.com \
    COGNIZEN_SSL=false \
    COGNIZEN_PORT=8080 \
    COGNIZEN_LOG_DIR=/tmp/ \
    COGNIZEN_DB_URL=mongodb://172.17.0.1:27017/cognizen \
    COGNIZEN_DB_USERNAME="" \
    COGNIZEN_DB_PASSWORD="" \
    COGNIZEN_SERVER=CTC \
    COGNIZEN_UPLOAD_DIR=/tmp/cognizen \
    COGNIZEN_REDMINE_HOST=172.17.0.1:10083/ \
    COGNIZEN_REDMINE_API_KEY="" \
    COGNIZEN_REDMINE_PROTOCOL=http
