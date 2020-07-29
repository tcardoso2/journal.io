#!/bin/sh

#
# Custom status script
#
echo "============================  Status of JOURNAL.io  ============================"
FILE=./process.pid
if [ -f "$FILE" ]; then
  echo "Journal.io process id: `cat ${FILE}`"
else 
    echo "Journal.io is not running"
fi

