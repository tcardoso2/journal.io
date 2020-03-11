#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var cmd=require('node-cmd');
var connection;
var processRules = require('./lib/ruleProcessor').process;

let DEFAULT_PORT = 8068;

console.log(process.env.LOG_SOCKET_PORT);

var server;

var reset = (close = true, callback) => {
  server.close();
  server.listen(getPort(), function(a) {
    console.log("SERVER: " + (new Date()) + ` Server is listening on port ${getPort()}`);
    if (callback) {
      callback(a);
    }
  });
}

var getPort = () => DEFAULT_PORT;

var setPort = (port) => {
  DEFAULT_PORT = port;
  reset();
}

var start = (callback) => {
  if(!server) {
    throw new Error("No server instance found. Did you forget to run 'configure()' first?");
  }
  reset(false, callback);
}

var configure = () => {
  server = http.createServer((request, response) => {
    console.log("SERVER: " + (new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
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
  wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log("SERVER: " + (new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    connection = request.accept('echo-protocol', request.origin);
    console.log(("SERVER: " + new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("SERVER: " + (new Date()) + 'Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log("SERVER: " + (new Date()) + 'Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log("SERVER: " + (new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });  
}
//internal functions
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//Public exports

exports.serverSend = (data) => {
    console.log("SERVER: " + (new Date()) + `Sending data: connection is active? ${connection.connected}`);
    connection.sendUTF(data);
}

exports.sendServerOutput = (command, rules = [], callback, send = true) => {
    //console.log(`Called cmd '${command}'...!`);
    let processRef = cmd.get(command);
    let data_line = "";
    //listen to the terminal output
    processRef.stdout.on(
        'data',
        function(data) {
          data_line += data;
          if (data_line[data_line.length-1] == '\n') {
            //Make sure we really copy the original string and not a reference of it
            let dataToSend = '' + data_line;
            data_line = ""; //We don't need it anymore
            try{
              processRules(dataToSend, rules, (output) => {
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
      }
    );
}

exports.getPort = getPort;

exports.setPort = setPort;

exports.getEndpoint = () => `ws://localhost:${getPort()}/`;

exports.start = start;

exports.configure = configure;