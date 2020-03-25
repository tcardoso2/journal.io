#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var cmd = require('./lib/command');
var connections = {};
var Library = (library) => require(`./lib/core/${library}`);
var processRules = require('./lib/ruleProcessor').process;

let DEFAULT_PORT = process.env.LOG_SOCKET_PORT || 8068;

console.log(DEFAULT_PORT);

var server;

var library = (name) => {
  switch(name) {
    case "ping":
      return Library(name);
    default:
      throw new Error(`${name} is not a defined library.`);
  }
}

var libraryCommand = (channel, callback) => {
  return library(channel.lib)[channel.func]((msg) => {
    callback(typeof msg == 'string' ? msg : JSON.stringify(msg)); 
  });
}

var reset = (close = true, callback) => {
  server.close();
  server.listen(getPort(), function(a) {
    console.log("SERVER: " + (new Date()) + ` Server is listening on port ${getPort()}`);
    if (callback) {
      callback(a);
    }
  });
}

var getConnectionsCount = () => {
  return Object.keys(connections).length;
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
  let connection;
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
    console.log("******************", request.resource);
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log("SERVER: " + (new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    console.log(("SERVER: " + new Date()) + ' Received a request attempting to validate protocol...');
    try {
      connection = request.accept('echo-protocol', request.origin);
    } catch(e) {
      console.error(e);
      console.log("Server will reject this connection and carry on...");
      return;
    }
    
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
    connections[request.resource] = connection;
  });
}
//internal functions
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//Public exports

exports.serverSend = (data, channel = '/') => {
    console.log("SERVER: " + (new Date()) + `Sending data: connection '${channel}' is active? ${connections[channel].connected}`);
    connections[channel].sendUTF(data);
}

exports.sendServerOutput = (command, rules = [], callback, send = true) => {
    //console.log(`Called cmd '${command}'...!`);
    let fn = typeof command == "string" ? cmd.do : libraryCommand;
    fn(command, (dataToSend) => {
      try{
        processRules(dataToSend, rules, (output) => {
          //console.log(data_line);
          if (callback) {
            setTimeout(() => {
              callback(false, output);
            }, 1);
          }
          if(send && connections[command.channel]) {
            connections[command.channel].sendUTF(output);
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
    });
}

exports.getPort = getPort;

exports.setPort = setPort;

exports.getEndpoint = () => `ws://localhost:${getPort()}`;

exports.start = start;

exports.configure = configure;

exports.Lib = library;

exports.getConnectionsCount = getConnectionsCount;
