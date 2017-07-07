FROM node:argon-alpine

ARG HTTP_PROXY
ARG HTTPS_PROXY

RUN mkdir -p /usr/src/app
COPY ./bin /usr/src/app

WORKDIR /usr/src/app/server
RUN npm install

RUN chown -R root:root /usr/src/app && chmod -R ug+rwX /usr/src/app

COPY docker-run.sh /usr/src/app/server/run.sh
CMD [ "/usr/src/app/server/run.sh" ]
EXPOSE 8080
USER 1001

ENV COGNIZEN_URL http://localhost:8080
ENV COGNIZEN_MAIL_SERVER localhost
ENV COGNIZEN_ADMIN_EMAIL admin@example.com
ENV COGNIZEN_DB_URL mongodb://localhost:27017/cognizen
ENV COGNIZEN_DB_USERNAME ""
ENV COGNIZEN_DB_PASSWORD ""
ENV COGNIZEN_REDMINE_HOST ""
ENV COGNIZEN_REDMINE_API_KEY ""
ENV COGNIZEN_REDMINE_PROTOCOL ""
