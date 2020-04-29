//let main = require('../../journal.io/index.js');
let server = require('./index');
let http = require('http');

//
//main.sendServerOutput('homebridge -D');

function startWebServer() {
  http.createServer((req, res) => {

    if (req.method == "GET") {
      res.writeHead(200, { "Content-type": "text/json" });
      if(req.url == "reset") {
        startServer();
      }
      res.end("{}");
    }
  }).listen(8084);  
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
    server.sendServerOutput('tail -f logs/homebridge.log');
  });
}

try{
  server.configure();
  startServer();
}catch(e){
  console.log("OOOooops an error occured!");
  console.error(e);
}
