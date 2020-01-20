"use strict" 
/*****************************************************
 * General
 *****************************************************/

let chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
let should = chai.should();
let index = require("../index.js");
const chokidar = require('chokidar');
var WebSocketClient = require('websocket').client; 
var client = new WebSocketClient();
var conn;
var callback;

before(function(done) {
  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  done();
});

describe("Considering a socket server,", function() {
  it("A client should be able to connect to it", function (done) {
    //Prepare

    function sendNumber() {
      if (conn.connected) {
        var number = Math.round(Math.random() * 0xFFFFFF);
        callback = (data) => {
          number.toString().should.equal(data);
          done();
        }
        conn.sendUTF(number.toString());
      }
    }
    //Evaluate
    client.connect('ws://localhost:8080/', 'echo-protocol');
    setTimeout(sendNumber, 1000);
  });

  it("A client should receive a message pushed by the server (trigger)", function (done) {
    callback = (clientData) => {
      clientData.should.equal("Message from server!!!");
      done();
    }
    
    client.connect('ws://localhost:8080/', 'echo-protocol');
    setTimeout(() => {
      index.serverSend("Message from server!!!");
    }, 1000);
  });

  it("Should be able to listen to changes on stdout from a command", function (done) {
    callback = (clientData) => {
      clientData.indexOf('index.js').should.equal(0);
      done();
    }
    client.connect('ws://localhost:8080/', 'echo-protocol');
    setTimeout(() => {
      index.sendServerOutput('ls');
    }, 1000);
  });
});

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
