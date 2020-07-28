//let main = require('../../journal.io/index.js');
let server = require('../index');
let http = require('http');
let config = require('../config.json');

const API_PORT = process.env.API_PORT || 8084;

//
//main.sendServerOutput('homebridge -D');

function startWebServer() {
  http.createServer((req, res) => {

    if (req.method == "GET") {
      res.writeHead(200, { "Content-type": "text/json" });
      if(req.url == "/reset") {
        try {
          startServer();
        } catch(e) {
           res.end(`{ error: ${e.message} }`);
        }
        res.end("{ restartServer: true }");
      } else {
        console.log(`GET: ${req.url}`);
        res.end("{}");
      }
    }
  }).listen(API_PORT);  
}
function startServer() {
  server.start((a) => {
    server.setCommandTimeout(0);
    server.ignoreLines(true);
    /*server.sendServerOutput({
      lib: "ping",
      func: "pingAll",
      channel: "ping"
    })*/
    //For the next command I want to disable the timeout
    server.sendServerOutput(config.command); //'tail -f ./target');
  });
}

try{
  server.configure();
  startWebServer();
  startServer();
}catch(e){
  console.log("OOOooops an error occured!");
  console.error(e);
}
