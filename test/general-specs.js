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
  server.configure();
  server.start((a) => {
    done();
  });
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
    //server.configure();
    server.start((a) => {
      //Evaluate
      client.connect(server.getEndpoint(), 'echo-protocol');
      setTimeout(sendNumber, 100);
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
    }, 100);
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
    }, 100);
  });

  it("Should be able to listen to 'ping', as a result of a library function call", function (done) {
    this.timeout(4000);
    callback = (clientData) => {
      clientData = JSON.parse(clientData);
      (clientData.error == null).should.eql(true);
      clientData.ttl.should.be.gt(0);
      done();
    }
    client.connect(server.getEndpoint() + '/ping', 'echo-protocol');
    setTimeout(() => {
      server.sendServerOutput({
        lib: "ping",
        func: "pingOne",
        channel: "ping"
      });
    }, 100);
  });

  it("Should be able get the number of active connections", function (done) {
    server.getConnectionsCount().should.be.gt(0);
    console.log(`  > TEST: current connections: ${server.getChannels()}`);
    done();
  });

  it("Should not be able to listen to 'ping' url, when message was sent from root url", function (done) {
    this.timeout(4000);
    callback = (clientData) => {
      clientData.trim().should.eql('PING');
      should.fail();
    }
    client.connect(server.getEndpoint() + '/ping', 'echo-protocol');
    setTimeout(() => {
      server.sendServerOutput('echo PING');
    }, 100);
    setTimeout(() => { done(); }, 2000)
  });
});

//helper functions
client.on('connectFailed', function(error) {
    console.log('  > TEST (client): Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('  > TEST (client): Client Connected!');
    conn = connection;
    connection.on('error', function(error) {
        console.log("  > TEST (client): Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('  > TEST (client): echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(`  > TEST (client): Received: "${message.utf8Data}", returning to callback now...`);
            callback(message.utf8Data);
        }
    });
});
