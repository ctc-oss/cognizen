#!/usr/bin/env bash

cat > config.json <<EOF
{   
    "url": "http://localhost:8080",
    "mailServer": "localhost",
    "adminEmail": "admin@example.com",
    "ssl": false,
    "port": 8080,
    "logFolder": "/tmp/",
    "dbUrl": "mongodb://172.17.0.1:27017/cognizen",
    "dbUsername": "",
    "dbPassword": "$",
    "uploadTempDir": "/tmp/cognizen",
    "redmineHost": "",
    "redminePort": "",
    "redmineApiKey": "",
    "redmineProtocal": ""
}
EOF

cat config.json

touch /tmp/cognizen.log
echoerr() { if [[ ${QUIET} -ne 1 ]]; then echo "$@" 1>&2; fi }

start_cognizen(){
      echo "start_cognizen"
      node cognizen-server.js
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
    when_ready start_cognizen &
    tail -f /tmp/cognizen.log
}

main "$@"