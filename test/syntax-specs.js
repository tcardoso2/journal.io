"use strict" 
/*****************************************************
 * Syntax
 *****************************************************/

let chai = require('chai')
let chaiAsPromised = require("chai-as-promised")
let should = chai.should()
let index = require("../index.js")
const chokidar = require('chokidar')
var WebSocketClient = require('websocket').client 
var client = new WebSocketClient()
var conn
var callback

before(function(done) {
  done()
});

after(function(done) {
  // here you can clear fixtures, etc.
  done()
});

describe("Considering a rules configuration file,", function() {
  it("The server should have a callback function triggered just before sending the reponse to the socket", function (done) {
    //Prepare
    index.sendServerOutput('echo "Some Stuff!"', [], (err, output) => {
      output.trim().should.equal('"Some Stuff!"')
      done()
    }, false) //Don't send anything from socket as it might interfere with other tests
  });

  it("if provided, rules must be an array", function (done) {
    //Prepare
    index.sendServerOutput('echo "Some Stuff!"', {
      rules: {
        rule1: ["split", " "]
      }
    }, (err, output) => {
      err.should.equal(true)
      output.should.equal("Error: Rules must be an Array. Check the documentation on rules.")
      done()
    }, false)
  });

  it("'split' rule", function (done) {
    //Prepare
    index.sendServerOutput('echo Some Stuff!', [
      [".split", " "]
    ], (err, output) => {
      output.should.be.eql(["Some",  "Stuff!\r\n"])
      err.should.equal(false)
      done()
    }, false)
  });

  it("'trim' rule", function (done) {
    //Prepare
    index.sendServerOutput('echo Some Stuff!', [
      [".trim"],      
      [".split", " "]
    ], (err, output) => {
      output.should.be.eql(["Some",  "Stuff!"])
      err.should.equal(false)
      done()
    }, false)
  });

  it("First item of array rule", function (done) {
    //Prepare
    index.sendServerOutput('echo Some Stuff!', [
      [".trim"],      
      [".split", " "],
      [0] 
    ], (err, output) => {
      output.should.equal("Some")
      err.should.equal(false)
      done()
    }, false)
  });

  it("'length' rule", function (done) {
    //Prepare
    index.sendServerOutput('echo Some Stuff!', [
      [".trim"],      
      [".split", " "],
      [".length"]
    ], (err, output) => {
      output.should.equal(2)
      err.should.equal(false)
      done()
    }, false)
  });

  it("'assign' rule", function (done) {
    //Prepare
    index.sendServerOutput('echo Some Stuff!', [
      [".trim"],      
      [".split", " "],
      ["=result"]
    ], (err, output) => {
      output.should.be.eql(["Some",  "Stuff!"])
      err.should.equal(false)
      done()
    }, false)
  });

  xit("'assign and reuse' rule", function (done) {
    //Prepare
    index.sendServerOutput('echo Some Stuff!', [
      [".trim"],      
      [".split", " "],
      ["=result"],
      ["result", 0],      
      [".append", " Magic!!"],      
    ], (err, output) => {
      output.should.equal("Some Magic!!")
      err.should.equal(false)
      done()
    }, false)
  });
});
