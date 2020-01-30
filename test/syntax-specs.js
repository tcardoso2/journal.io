"use strict" 
/*****************************************************
 * Syntax
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

describe("Considering a rules configuration file,", function() {
  xit("The server should have a callback function triggered just before sending the reponse to the socket", function (done) {
    //Prepare
    index.sendServerOutput('echo "Some Stuff!"', {}, (output) => {
      if(output == '"Some stuff!"') {
        done()
      }
    });
  });

  xit("The server should have an argument which sends the rules required", function (done) {
    //Prepare
    index.sendServerOutput('echo "Some Stuff!"', {
      rules: {
        rule1: ["split", " "]
      }
    }, (output) => {
      output.should.be.eql(["Some",  "stuff!"])
      done
    });
  });
});
