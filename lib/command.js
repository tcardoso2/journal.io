/**
 * Wrapper to the node-cmd library
 */
var cmd=require('node-cmd');
var eventsCount = 0;

exports.do = (command, callback, from =0, lines = 10, timeout = 10000) => {
  let processRef = cmd.get(command);
  let data_line = "";
  let index = 0;
  //listen to the terminal output
  let _event = ('data', (data) => {
    if (lines <= 0) {
      eventsCount--;
      //console.debug(`Limit of lines expired, ignoring data from terminal and removing event (count = ${eventsCount})...`);
      processRef.stdout.removeListener('data', _event);
      return;
    }
    index++;
    if(index <= from) return;
    data_line += data;
      if (data_line[data_line.length-1] == '\n') {
        lines--;
        index++;
        if(index <= from) return; 
        //Make sure we really copy the original string and not a reference of it
        let dataToSend = '' + data_line;
        data_line = ""; //We don't need it anymore
        callback(dataToSend);
      }
    });
  processRef.stdout.on('data', _event);
  //Set event timeout
  setTimeout(() => { 
    //console.debug(`Removing event due to timeout...`);
    processRef.stdout.removeListener('data', _event);
    eventsCount--; 
  }, timeout);
  eventsCount++;
}
