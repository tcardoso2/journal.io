/**
 * Wrapper to the node-cmd library
 */
var cmd=require('node-cmd');
var eventsCount = 0;
var log = require('./utils').log;

exports.do = (command, callback, from =0, lines = 10, timeout = 10000) => {
  log.debug(`Called function with args: "${command}, ${callback}", "${from}, ${lines}, ${timeout}`);
  let processRef = cmd.get(command);
  let data_line = "";
  let index = 0;
  //listen to the terminal output
  let _event = ('data', (data) => {
    log.debug(`Received data from output: ${data}...`);
    if (lines <= 0) {
      eventsCount--;
      log.debug(`Limit of lines expired, ignoring data from terminal and removing event (count = ${eventsCount})...`);
      processRef.stdout.removeListener('data', _event);
      return;
    }
    index++;
    log.debug(`'index' was increased to ${index}...`);
    if(index <= from) return;
    data_line += data;
    if (data_line[data_line.length-1] == '\n') {
      log.debug('Received all the data from this line');
      lines--;
      index++;
      if(index <= from) return; 
      //Make sure we really copy the original string and not a reference of it
      let dataToSend = '' + data_line;
      data_line = ""; //We don't need it anymore
      log.debug(`Sending final data to callback: '${dataToSend}'`);
      callback(dataToSend);
    }
  });
  processRef.stdout.on('data', _event);
  //Set event timeout
  setTimeout(() => { 
    log.debug(`Removing event due to timeout...`);
    processRef.stdout.removeListener('data', _event);
    eventsCount--; 
  }, timeout);
  eventsCount++;
}
