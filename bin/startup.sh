#!/bin/sh

#
# Custom start script
#
echo "============================  Starting JOURNAL.io  ============================"
LOG_LEVEL=info
./bin/server.js > ./logs/journal.io.log &
echo $! > ./process.pid
echo "Started with process id: `cat ./process.pid`"
