#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var cmd=require('node-cmd');
var connection;
var processRules = require('./lib/ruleProcessor').process;

let DEFAULT_PORT = 8088;

var getPort = () => DEFAULT_PORT;

var setPort = (port) => DEFAULT_PORT = port;

console.log(process.env.LOG_SOCKET_PORT);

var server = http.createServer((request, response) => {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(getPort(), function() {
    console.log((new Date()) + ` Server is listening on port ${getPort()}`);
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

//internal functions
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

//Public exports

exports.serverSend = (data) => {
    console.log(`Sending data: connection is active? ${connection.connected}`);
    connection.sendUTF(data);
}

exports.sendServerOutput = (command, rules = [], callback, send = true) => {
    //console.log(`Called cmd '${command}'...!`);
    let processRef = cmd.get(command);
    let data_line = "";
    //listen to the python terminal output
    processRef.stdout.on(
        'data',
        function(data) {
        data_line += data;
        if (data_line[data_line.length-1] == '\n') {
          try{
            processRules(data_line, rules, (output) => {
              //console.log(data_line);
              if (callback) {
                setTimeout(() => {
                callback(false, output);
                }, 1);
              }
              if(send && connection) {
                connection.sendUTF(output);
              }
            });
          } catch(e) {
            if (callback) {
              callback(true, e.message);
            } else { //Re-throw
              throw e;
            }
            return;
          }
        }
    });
}

exports.getPort = getPort;

exports.setPort = setPort;

exports.getEndpoint = () => `ws://localhost:${getPort()}/`;