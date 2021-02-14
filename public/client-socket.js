/**
 * Socket client library module for Journal.io
 * @type object
 * @since 0.3.9
 */

//const ENDPOINT = "wss://casapoint.ngrok.io";
const DEFAULT_PORT = 8069;
let ENDPOINT=`ws://localhost:${DEFAULT_PORT}/`;

//Socket communication
let sockets = {};
const FORCE_RECONNECT = true; //True to attempt re-connecting, even if the server closed cleanly
export const status = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  CLOSED: 3
}

let _status = status.CONNECTING;
let _reconnectHandler;
let _timeout = 5000;
let callbackOnError = () => {}; //Empty function
let callbackOnWarn = () => {}; //Empty function
let callbackOnOpen = () => {}; //Empty function
let callbackOnMessage = () => {}; //Empty function
let callbackOnClose = () => {}; //Empty function
let callbackOnTick = () => {}; //Empty function

/* Module private functions */
function configure(socket) {
  socket.onopen = function(e) {
    _status = status.CONNECTED;
    _timeout = 5000;
    console.log(`[open] [${socket.__channel}] Connection established`);
    callbackOnOpen(e, _status);
  };
  
  //TODO: Separate this function into its own module
  function parseData(input) {
    let el = input.split('[Revc]');
    return el.length == 2 ? JSON.parse(el[1].replace("[39m","")) : el[0];
  }
  
  socket.onmessage = function(event) {
    let data = event.data;
    console.log(`[message] Data received from server: ${data}`);
    data = parseData(data);
    //Example of data:
    //{
    //  "cmd":"report",
    //  "model":"sensor_motion.aq2",
    //  "sid":"158d000272bd25",
    //  "short_id":64351,
    //  "data":
    //    {"lux":"94"}
    //}
    callbackOnMessage(data, _status);
  };
  
  socket.onclose = function(event) {
    if (event.wasClean) {
      console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      _status = status.CLOSED;
      callbackOnClose(event, _status);
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      _status = status.DISCONNECTED;
      console.log('[close] Connection died');
      callbackOnWarn(`Connection closed unexpectedly. Retrying to connect in ${_timeout/1000} second(s)...`, _status);
    }
  };

  socket.onerror = function(error, callbackError) {
    console.log(`[error] ${error.message}`);
    callbackOnError(error);
  };
}

export function start(endpoint = 'localhost', port = DEFAULT_PORT, protocol = 'ws', channel = 'main') {
  resetSocket(endpoint, port, protocol, channel);
  _reconnectHandler = setInterval( () => {
    if(_status == status.CONNECTING || _status == status.DISCONNECTED || (_status == status.CLOSED && FORCE_RECONNECT)) {
      _timeout-= 1000;
      if (_status == status.CONNECTING) {
        callbackOnWarn(`Connecting now (${-_timeout/1000} second(s) elapsed)...`, _status);
        return;
      }
      callbackOnWarn(`Connection closed unexpectedly. Retrying to connect in ${_timeout/1000} second(s)...`, _status);
      if(_timeout <= 0) {
        _status = status.CONNECTING;
        _timeout = 0;
        resetSocket(endpoint, port, protocol, channel);
        callbackOnWarn("Connecting now...", _status);
        return;
      }  
    } else {
      callbackOnTick(_status);
    }
  }, 1000);
}

/* Exports */
export function resetSocket(endpoint = 'localhost', port = DEFAULT_PORT, protocol = 'ws', channel = 'main') {
  ENDPOINT = `${protocol}://${endpoint}:${port}/`;
  _status = status.CONNECTING;
  sockets[channel] = new WebSocket(ENDPOINT + channel, 'echo-protocol');
  sockets[channel].__channel = channel;
  configure(sockets[channel]);
  //Reverse reference
  return sockets[channel];
}

export function setCallbackOnOpen(callback) {
  callbackOnOpen = callback;
}

export function setCallbackOnClose(callback) {
  callbackOnClose = callback;
}
  
export function setCallbackOnError(callback) {
  callbackOnError = callback;
}

export function setCallbackOnMessage(callback) {
  callbackOnMessage = callback;
}

export function setCallbackOnWarn(callback) {
  callbackOnWarn = callback;
}

export function setCallbackOnTick(callback) {
  callbackOnTick = callback;
}
  