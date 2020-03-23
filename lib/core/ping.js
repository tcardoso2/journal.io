#!/usr/bin/env node

/*
 * Ping Core Library
 */
var cmd = require('../command');

exports.pingOne = (callback) => {
  cmd.do("ping 127.0.0.1", (data) => {
    //64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.106 ms
    let _bytes = data.split(' ')[0];
    let _host = data.split(':')[0].split(' ');
    let _attrs = data.split(':')[1].split(' ');
    console.log(data);
    callback({
      bytes: _bytes,
      host: _host[_host.length -1],
      icmp_seq: parseInt(_attrs[1].split('=')[1]),
      ttl: parseInt(_attrs[2].split('=')[1]),
      time: parseFloat(_attrs[3].split('=')[1]),
      time_unit: _attrs[4].trim()
    });
  }, 1, 1);
}

if (require.main === module) {
    cmd.do("ping localhost", (msg) => {
        console.log(msg);
        console.log("done!");
    });
} else {
    console.log('required as a module');
}

 
