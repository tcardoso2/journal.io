# journal.io
An external simple logs web-socket server.
Meant originally to send log updates via web-socket but it can run
any command and capture it's output.

* Install:
```
npm install journal.io
```

* Simple example usage
```
let server = require('journal.io');

server.setPort(8054); //If you want to override the default websocket port (8068)
server.configure();
server.start(() => {
  server.sendServerOutput(`tail -f somelogfile.log`);
});
```

Rules (WIP)
-----------
In future the server will be able to filter content captured based on some basic rules which can be configure.
I'll update this section soon with details.

Test socket clients
-------------------
Inside the "lib" folder there are 2 socket clients which you can use if you want:
* Server-side client (NodeJS): mock.js
* HTML client (Javascript): mock.html

Tests (mocha)
-----
Just run 
```
mocha --exit
```
Or
```
npm test
```

Version History
---------------
* v 0.1.9: Bug fix: sending just the line changed and not the full output
* v 0.1.8: Server now does not start when required (imported), but only after running "configure()" and "start()" method
* v 0.1.7: Added setPort to allow changing the default port of a given instance without having to fiddle with Environment variables, removed ENV variable setting for ports
* v 0.1.7: Added setPort to allow changing the default port of a given instance without having to fiddle with Environment variables, removed ENV variable setting for ports
* v 0.1.6: Added first rules, split, trim, length, array (WIP)
* v 0.1.5: Minor change on test file
* v 0.1.4: Code and test code improvements, added LOG_SOCKET_PORT environment variagle which can be used to override the server socket port. In future, the name of the library should be renamed as it does not relate to homebrige, it is a generic log socket tool. Adjusted CI instructions.
* v 0.1.3: Added Web-page mock client. Started working with rules syntax (WIP).
* v 0.1.2: WIP on listening to command stdout changes.
* v 0.1.1: Added example for server trigger push to client via function "serverSend".
* v 0.1.0: First test using https://www.npmjs.com/package/websocket example.

