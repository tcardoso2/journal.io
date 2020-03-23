#!/usr/bin/env node

/*
 * Ping Core Library
 */
var cmd = require('../command');
var ping = require('node-ping');

exports.pingOne = (callback) => {
  cmd.do("ping localhost", callback, 1);
}

if (require.main === module) {
    cmd.do("ping localhost", (msg) => {
        console.log(msg);
        console.log("done!");
    });
} else {
    console.log('required as a module');
}

 
