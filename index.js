#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var cmd = require('./lib/command');
var connections = {};
var Library = (library) => require(`./lib/core/${library}`);
var processRules = require('./lib/ruleProcessor').process;
let LOG_LEVEL = process.env.LOG_LEVEL || 'info';
let DEFAULT_PORT = process.env.LOG_SOCKET_PORT || 8068;
var log = require('./lib/utils.js').setLevel(LOG_LEVEL);

log.info(` Default port: ${DEFAULT_PORT}`);
log.info(process.env)

var server;

var library = (name) => {
  log.debug(`Called function with args: "${name}"`);
  switch(name) {
    case "ping":
      return Library(name);
    default:
      throw new Error(`${name} is not a defined library.`);
  }
}

var libraryCommand = (channel, callback) => {
  log.debug(`Called function with args: "${channel}", "${callback}`);
  return library(channel.lib)[channel.func]((msg) => {
    log.debug(`Called function with args: "${msg}"`);
    callback(typeof msg == 'string' ? msg : JSON.stringify(msg)); 
  });
}

var reset = (close = true, callback) => {
  log.debug(`Called function with args: "${close}", "${callback}`);
  server.close();
  server.listen(getPort(), function(a) {
    log.info(`Server is listening on port ${getPort()}`);
    if (callback) {
      callback(a);
    }
  });
}

var getChannels = () => {
  log.debug(`Called function`);
  return Object.keys(connections);
}

var getConnectionsCount = () => {
  log.debug(`Called function`);
  return getChannels().length;
}

var getPort = () => {
  log.debug(`Called function`);
  return DEFAULT_PORT;
}

var setPort = (port) => {
  log.debug(`Called function with args: "${port}"`);
  DEFAULT_PORT = port;
  reset();
}

var start = (callback) => {
  log.debug(`Called function with args: "${callback}`);
  if(!server) {
    throw new Error("No server instance found. Did you forget to run 'configure()' first?");
  }
  reset(false, callback);
}

var configure = () => {
  log.debug(`Called function`);
  let connection;
  server = http.createServer((request, response) => {
    logi.info(' Received request for ' + request.url);
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
    log.debug(`Called function with args: "${request}`);
    log.info(' Requesting connection to channel: ' + request.resource);
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      log.warning('Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    log.info('Received a request attempting to validate protocol...');
    try {
      connection = request.accept('echo-protocol', request.origin);
    } catch(e) {
      log.error(e);
      log.warn("Server will reject this connection and carry on...");
      return;
    }
    
    log.info('Connection accepted.');
    connection.on('message', function(message) {
      log.debug(`Called function with args: "${message}`);
      log.info(`Connection (resource name: ${connection.__resource} received a message!`);
      if (message.type === 'utf8') {
        log.info('Received Message: ' + message.utf8Data);
        connection.sendUTF(message.utf8Data);
      }
      else if (message.type === 'binary') {
        log.info('Received Binary Message of ' + message.binaryData.length + ' bytes');
        connection.sendBytes(message.binaryData);
      }
    });
    connection.on('close', function(reasonCode, description) {
      log.info(' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    let _resource = request.resource ? request.resource : '/';
    connections[_resource] = connection;
    //Add a reverse reference on the connection
    connections[_resource].__resource = _resource;
  });
}
//internal functions
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//Public exports

exports.serverSend = (data, channel = '/') => {
  log.info(`Sending data: connection '${channel}' is active? ${connections[channel].connected}`);
  connections[channel].sendUTF(data);
}

exports.sendServerOutput = (command, rules = [], callback, send = true) => {
  log.debug(`Called function with args: "${command}", "${rules}", "${callback}", "${send}"`);
  let fn = typeof command == "string" ? cmd.do : libraryCommand;
  fn(command, (dataToSend) => {
    log.debug(`Callback from sendServerOutput with args: '${command}', '${dataToSend}'...`);
    try{
      log.info('Received output, initiating rules processing...');
      processRules(dataToSend, rules, (output) => {
        //console.log(data_line);
        if (callback) {
          setTimeout(() => {
            log.info('Returning to callback');
            log.debug(output);
            callback(false, output);
          }, 1);
        }
        let _channel = `${command.channel}` == 'undefined' ? '/' : `/${command.channel}`;
        log.info(`SOCKET: sendUTF event to channel '${_channel}'?`);
        log.debug(`${send}, '${_channel}', ${connections[_channel]}`);
        if(send) {
          if(connections[_channel]) {
            connections[_channel].sendUTF(output);
            log.info(`sent info via socket to channel '${_channel}'`);
          } else {
            let _err = `Ooooops, I was trying to send a message via web-sockets to channel '${_channel}', but that channel does not exist!`;
            log.error(_err);
          }
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

exports.setCommandTimeout = (t) => cmd.setTimeout(t); 

exports.ignoreLines = (b) => cmd.ignoreLines(b);

exports.getPort = getPort;

exports.setPort = setPort;

exports.getEndpoint = () => `ws://localhost:${getPort()}`;

exports.start = start;

exports.configure = configure;

exports.Lib = library;

exports.getConnectionsCount = getConnectionsCount;

exports.getChannels = getChannels;
