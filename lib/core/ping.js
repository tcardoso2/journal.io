#!/usr/bin/env node

/*
 * Ping Core Library
 */
var cmd = require('../command');
let results = [];

exports.pingOne = (callback, host = '127.0.0.1') => {
  let _cmd = `ping ${host}`;
  cmd.do(_cmd, (data) => {
    //Example output: 64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.106 ms
    //console.log("##########", data);
    if(data.indexOf("Host Unreachable") > 0) {
      callback({ error: "Host Unreachable", input_cmd: _cmd });
      return;
    }
    let _bytes = data.split(' ')[0];
    let _host = data.split(':')[0].split(' ');
    let _attrs = data.split(':')[1].split(' ');
    callback({
      error: null,
      input_cmd: _cmd, 
      bytes: _bytes,
      host: _host[_host.length -1],
      icmp_seq: parseInt(_attrs[1].split('=')[1]),
      ttl: parseInt(_attrs[2].split('=')[1]),
      time: parseFloat(_attrs[3].split('=')[1]),
      time_unit: _attrs[4].trim()
    });
  }, 1, 1);
}

exports.pingAll = (callback, progressCallback, pattern = '192.168.0.*', from = 1, count = 0) => {
  let _limit = count == 0 ? 255 : count;
  from = from <= 0 ? 1 : from;
  _first = from;
  results = [];
  let _iter = () => {
    //console.log(from);
    exports.pingOne((data) => {
      results.push(data);
      progressCallback(data);
      if(results.length == _limit) {
        callback(results);
      }
    }
    , `${pattern.replace('*', from)}`);
    from++;
    if((from-_first) <= _limit) {
      setTimeout(_iter, 1);
    }
  }
  _iter();
}

if (require.main === module) {
  exports.pingAll((msg) => {
    console.log("done!");
  }, (msg) => {
    if(!msg.error) console.log(msg.host);
  });
} else {
  console.log('required as a module');
}
 
