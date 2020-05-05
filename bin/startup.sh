#!/bin/sh

#
# Custom start script
#
echo "============================  Starting JOURNAL.io  ============================"
node ./bin/server.js > ./logs/journal.io.log
