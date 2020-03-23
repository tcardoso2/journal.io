/**
 * Wrapper to the node-cmd library
 */
var cmd=require('node-cmd');

exports.do = (command, callback, from =0, lines = 10) => {
  //console.log(`Called cmd '${command}'...!`);
  console.log('.');
  let processRef = cmd.get(command);
  let data_line = "";
  let index = 0;
  //listen to the terminal output
  processRef.stdout.on('data', (data) => {
    if (lines <= 0) {
      console.info('Limit of lines expired, ignoring data from terminal...');
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
}
