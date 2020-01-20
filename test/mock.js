var WebSocketClient = require('websocket').client; 
var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('Client Connected');
    conn = connection;
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
            callback(message.utf8Data);
        }
    });
});
let callback = (data) => {
    console.log(">>>>>>>", data);
}
client.connect('ws://192.168.0.186:8080/', 'echo-protocol');
