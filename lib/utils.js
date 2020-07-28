/*
 * Utils: General utils class for stuff which needs to be used by every other file in this module.
 *        also referred in main, and can be accessed externally from the module via utils.
 *        originally taken from another of my side-projects, vermon.
 * @author: Tiago Cardoso
 * @from: 0.2.2
 */
let flatted = require('flatted')
let tracer = require('tracer')
let LOG_LEVEL = process.env.LOG_LEVEL || 'trace';

try {
  !__log;
} catch(e) {
  global.__log = tracer.colorConsole({ level: 'trace' }) // initialization requires it to go to trace level, can go up but not down, see https://www.npmjs.com/package/tracer
  __log.info('Setting global log for the first time...');
  __log.warning = __log.warn
  tracer.setLevel(LOG_LEVEL) // Will start with this level
  tracer.console({
    inspectOpt: {
      showHidden: true, // the object's non-enumerable properties will be shown too
      depth: 5 // tells inspect how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Defaults to 2. To make it recurse indefinitely pass null.
    }
  })
}

exports = module.exports = {
  JSON: {
    stringify: (str) => {
      try {
        return JSON.stringify(str)
      } catch (e) {
        if (e instanceof TypeError) {
          __log.debug(`Error in stringifying object (${e.message}), attempting with "flatted"...`)
          try {
            return flatted.stringify(str)
          } catch (e) {
            let msg = `Error in stringifying object (${e.message})`
            __log.warn(msg)
            return msg
          }
        }
        // Unhandled, re-throw
        throw e
      }
    }
  },
  log: __log,
  setLevel: (traceLevel) => {
    // This is required to reset the current instance
    console.log(tracer.setLevel)
    __log.warn(`Setting log level to ${traceLevel}.`)
    tracer.setLevel(traceLevel)
    return __log
  },
  splitArgs (func) {
    // Returns array of the arguments in the class constructor
    return (func + '').
      replace(/[/][/].*$/mg, ''). // strip single-line comments
      replace(/\s+/g, ''). // strip white space
      replace(/[/][*][^/*]*[*][/]/g, ''). // strip multi-line comments
      split('){', 1)[0].replace(/^[^(]*[(]/, ''). // extract the parameters
      replace(/=[^,]+/g, ''). // strip any ES6 defaults
      split(',').
      filter(Boolean) // split & filter [""]
  },
  extend (obj, src) {
    for (let key in src) {
      if (src.hasOwnProperty(key)) { obj[key] = src[key]; }
    }
    return obj;
  }
}
