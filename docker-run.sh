#!/usr/bin/env bash

cat > config.json <<EOF
{   
    "url": "$COGNIZEN_URL",
    "mailServer": "$COGNIZEN_MAIL_SERVER",
    "adminEmail": "$COGNIZEN_ADMIN_EMAIL",
    "ssl": $COGNIZEN_SSL,
    "port": $COGNIZEN_PORT,
    "logFolder": "$COGNIZEN_LOG_DIR",
    "dbUrl": "$COGNIZEN_DB_URL",
    "dbUsername": "",
    "dbPassword": "",
    "server" : "$COGNIZEN_SERVER",
    "uploadTempDir": "$COGNIZEN_UPLOAD_DIR",
    "redmineHost": "$COGNIZEN_REDMINE_HOST",
    "redmineApiKey": "$COGNIZEN_REDMINE_API_KEY",
    "redmineProtocal": "$COGNIZEN_REDMINE_PROTOCOL"
}
EOF

cat config.json

touch /tmp/cognizen.log
echoerr() { if [[ ${QUIET} -ne 1 ]]; then echo "$@" 1>&2; fi }

start_cognizen(){
      echo "start_cognizen"
      node cognizen-server.js
}

add_admin(){
    echo "add_admin"
    # TODO: figure out how to add initial admin.
#    mongo cognizen --eval "db.users.insert({firstName: 'Cognizen', lastName: 'Admin', username: 'admin@cognizen.com',
#    token:'MY_MlHiBG6gBE6N8XZxOXrirtedMyGPHotbgk2GIv8rXIgS7vNMXH2dvAx4JIxjx',
#    password:'$2a$10$JbxIXej/0yO.ytrQCC1yI.fwO.oFrb4M8nUI2alOEG3ezLU/RTr2K', admin:'true', active:'true'})"
    start_cognizen
}

wait_on(){
   local url="$1"

    echoerr "waiting on $url"
#    until $(curl -s -o /dev/null --fail "$url"); do
    pgrep mongo
    while [[ $? -ne 0 ]]; do
        echoerr "waiting on $url"
        sleep 5
    done
}

when_ready(){
    wait_on "http://172.17.0.1:27017/cognizen"
    "$@"

}
main() {
    when_ready add_admin &
    tail -f /tmp/cognizen.log
}

main "$@"