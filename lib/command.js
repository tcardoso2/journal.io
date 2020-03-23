/**
 * Wrapper to the node-cmd library
 */
var cmd=require('node-cmd');

exports.do = (command, callback) => {
  //console.log(`Called cmd '${command}'...!`);
  console.log('.');
  let processRef = cmd.get(command);
  let data_line = "";
  //listen to the terminal output
  processRef.stdout.on('data', (data) => {
    console.log('.');
    data_line += data;
      if (data_line[data_line.length-1] == '\n') {
        //Make sure we really copy the original string and not a reference of it
        let dataToSend = '' + data_line;
        data_line = ""; //We don't need it anymore
        callback(dataToSend);
      }
    });
}
