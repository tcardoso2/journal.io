"use strict" 
/*****************************************************
 * General
 *****************************************************/

let chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
let should = chai.should();
let server = require("../index.js");
const chokidar = require('chokidar');
let WebSocketClient = require('websocket').client; 
let client = new WebSocketClient();
let conn;
let callback;

before(function(done) {
  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  client.abort();
  done();
});

describe("Considering a socket server,", function() {
  it("A client should be able to connect to it", function (done) {
    //Prepare
    this.timeout(4000);
    function sendNumber() {
      var number = Math.round(Math.random() * 0xFFFFFF);
      callback = (data) => {
        number.toString().should.equal(data);
        done();
      }
      if (conn.connected) {
        conn.sendUTF(number.toString());
      }
      else {
        console.error("Client not connected yet!, test will fail.");
      }
    }
    server.configure();
    server.start((a) => {
      //Evaluate
      client.connect(server.getEndpoint(), 'echo-protocol');
      setTimeout(sendNumber, 1000);
    });
  });

  it("A client should receive a message pushed by the server (trigger)", function (done) {
    callback = (clientData) => {
      clientData.should.equal("Message from server!!!");
      done();
    }
    
    client.connect(server.getEndpoint(), 'echo-protocol');
    setTimeout(() => {
      server.serverSend("Message from server!!!");
    }, 1000);
  });

  it("Should be able to listen to changes on stdout from a command", function (done) {
    this.timeout(4000);
    callback = (clientData) => {
      clientData.trim().should.eql('TEST');
      done();
    }
    client.connect(server.getEndpoint(), 'echo-protocol');
    setTimeout(() => {
      server.sendServerOutput('echo TEST');
    }, 1000);
  });
});

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('Client Connected!');
    conn = connection;
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(`Received: "${message.utf8Data}", returning to callback now...`);
            callback(message.utf8Data);
        }
    });
});
