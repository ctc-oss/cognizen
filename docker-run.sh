#!/bin/sh

cat > config.json <<EOF
{   
    "url": "$COGNIZEN_URL",
    "mailServer": "$COGNIZEN_MAIL_SERVER",
    "adminEmail": "$COGNIZEN_ADMIN_EMAIL",
    "ssl": false,
    "port": 8080,
    "logFolder": "./",
    "dbUrl": "$COGNIZEN_DB_URL",
    "dbUsername": "$COGNIZEN_DB_USERNAME",
    "dbPassword": "$COGNIZEN_DB_PASSWORD",
    "uploadTempDir": "/tmp/cognizen",
    "redmineHost": $COGNIZEN_REDMINE_HOST,
    "redminePort": $COGNIZEN_REDMINE_PORT,
    "redmineApiKey": $COGNIZEN_REDMINE_API_KEY,
    "redmineProtocal": $COGNIZEN_REDMINE_PROTOCOL,
    "redmineProtocol": $COGNIZEN_REDMINE_PROTOCOL
}
EOF

cat config.json
node cognizen-server.js
