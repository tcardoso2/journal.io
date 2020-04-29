#!/bin/sh

#
# Custom start script
#
echo "============================  Starting JOURNAL.io  ============================"
LOG_SOCKET_PORT=8068 node server.js
