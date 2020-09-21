#!/bin/sh

#
# Custom start script
#
echo "============================  Starting JOURNAL.io  ============================"
LOG_LEVEL=info
./bin/server.js start > ./logs/journal.io.log &
echo $! > ./process.pid
echo "Started with process id: `cat ./process.pid`"

sleep 2s

tail -f ./logs/journal.io.log

# Process will stay working for one day. If you have a restarting container, that means
# it will restart after 24h. For now done only for test purpuses, in future might allow
# this being done via other means
sleep 1d
