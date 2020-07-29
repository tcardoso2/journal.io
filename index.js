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
let config = require('./config.json');

log.info(` Default port: ${DEFAULT_PORT}`);
log.info(process.env)

var server;
var lastPref; //Last process refence which gets ran via node-cmd

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
    log.info(' Received request for ' + request.url);
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
    log.info(`Current Server connections: ${wsServer.connections.length}`);
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
    log.info(`Current Server connections: ${wsServer.connections.length}`);
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
      connection.sendUTF(`Server received close event with reason code ${reasonCode} and description ${description}...`);
      log.warn(` Peer ${connection.remoteAddress} with resource name: ${connection.__resource} disconnected.`);
      delete connections[_resource];
      log.debug(wsServer);
      connection.close();
      log.warn(`Closing connection. Current Server connections: ${wsServer.connections.length}`);
    });
    let _resource = request.resource ? request.resource : '/';
    connections[_resource] = connection;
    //Add a reverse reference on the connection
    connections[_resource].__resource = _resource;
  });
  setupHeartBeat();
}

function setupHeartBeat() {
  if(config.heartbeat && config.heartbeat.on) {
    let _heartBeatCount = 0;
    log.info("Setting up Heartbeat...");
    let _interval = config.heartbeat.every || 10000;
    setInterval(() => {
      _heartBeatCount++;
      log.info(`Sending heartbeat #${_heartBeatCount} to clients...`);
      for(var conn in wsServer.connections) {
        wsServer.connections[conn].sendUTF(`[Heartbeat from server] Last process status:\
 connected: ${lastPref.connected},\
 signalCode: ${lastPref.signalCode},\
 exitCode: ${lastPref.exitCode},\
 killed: ${lastPref.killed},\
 beat: ${_heartBeatCount},\
 timed-out: ${lastPref.timedOut}`);
        log.debug(lastPref);
        if(lastPref.killed) {
          log.error(`Oh no! The underlying process was killed (pid: ${lastPref.pid})`);
          log.debug(lastPref);
        }
      }
    }, _interval);
  }
}

function setupProcessErrorHandling() {
  if(config.processErrorHandling && config.processErrorHandling.on) {
    if(lastPref) {
      log.info("Setting up Process Error Handling...");
      lastPref.on('close', (exitCode, signalCode) => {
        log.error(`Last Process Closed: ${exitCode}, ${signalCode}, will respawn it...`);
        //Attempting retry?
        let _command = lastPref.spawnargs[2];
        exports.sendServerOutput(_command);
      });
      lastPref.on('error', (arg1, arg2, arg3) => {
        log.error(`Last Process Error: ${arg1}, ${arg2}, ${arg3}`);
      });
    }
  } 
}

//internal functions
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//Public exports

exports.serverSend = (data, channel = '/main') => {
  let _isActive = connections[channel] && connections[channel].connected;
  log.info(`Sending data: connection '${channel}' is active? ${_isActive}`);
  connections[channel].sendUTF(data);
}

exports.sendServerOutput = (command, rules = [], callback, send = true) => {
  log.debug(`Called function with args: "${command}", "${rules}", "${callback}", "${send}"`);
  let fn = typeof command == "string" ? cmd.do : libraryCommand;
  lastPref = fn(command, (dataToSend) => {
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
        let _channel = `${command.channel}` == 'undefined' ? '/main' : command.channel;
        log.info(`SOCKET: sendUTF event to channel '${_channel}'?`);
        log.debug(`${send}, '${_channel}', ${connections[_channel]}`);
        if(send) {
          if(connections[_channel]) {
            connections[_channel].sendUTF(output);
            log.info(`sent info via socket to channel '${_channel}'`);
          } else {
            let _err = `Trying to send message to channel '${_channel}', but that channel does not exist!`;
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
  setupProcessErrorHandling();
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
