#!/bin/sh

#
# Custom start script
#

LOG_SOCKET_PORT=8070 node server.js > journal.io.log &
