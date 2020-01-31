# ext_log_socket
An external (non homebridge) simple logs web-socket, for homebridge

* v 0.1.4: Code and test code improvements, added LOG_SOCKET_PORT environment variagle which can be used to override the server socket port. In future, the name of the library should be renamed as it does not relate to homebrige, it is a generic log socket tool. Adjusted CI instructions.
* v 0.1.3: Added Web-page mock client. Started working with rules syntax (WIP).
* v 0.1.2: WIP on listening to command stdout changes.
* v 0.1.1: Added example for server trigger push to client via function "serverSend".
* v 0.1.0: First test using https://www.npmjs.com/package/websocket example.
