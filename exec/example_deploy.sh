#!/bin/bash
set -Eeuo pipefail
trap earlyExit SIGINT SIGTERM
trap 'catch $? $LINENO' ERR
DISCORD_WEBHOOK_URL =  'https://discordapp.com/api/webhooks/00000000000000000000000/???????????????????????????'

function earlyExit(){
    trap - SIGINT SIGTERM # clear the trap
    kill -- -$$ # Sends SIGTERM to child/sub processes
    exit
}

catch() {
  if [ "$1" != "0" ]; then
    # error handling goes here
    echo  "Line: $(caller) failed command:  ${BASH_COMMAND} "
    earlyExit
  fi
}
function log(){
    CONTENT=$(jq --null-input \
    --arg content "$1" \
    '{"content": $content}')

    curl -X POST "$DISCORD_WEBHOOK_URL"  \
    --header 'Accept: */*' \
    --header 'User-Agent: Thunder Client (https://www.thunderclient.com)' \
    --header 'Content-Type: application/json' \
    -d "${CONTENT}"
}

DATA="$1" 
REPO_NAME=$( echo "$DATA" | jq -r '.repository.name' )
COMMIT_MSG=$( echo "$DATA" | jq -r '.head_commit.message' )


# Enter your deploy logic here 
# with known $REPO_NAME $COMMIT_MSG and all available info inside $DATA
# in case jq is missing ( Ubuntu ) : apt install jq
