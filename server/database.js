var database = module.exports;
var sqlite = require('sqlite3');
var logger = require('just-logging').getLogger();

var db;

/**
 * A list of methods from the sqlite library that are exposed by the database
 * module. Each of these just proxy directly through to the matching sqlite
 * method.
 * @constant
 */
const METHODS = [
  'run', 'get', 'all'
];

function exposeMethod(name) {
  logger.debug('Exposing database method:', name);
  database[name] = db[name].bind(db);
}

database.initialize = function(app, cb) {
  db = new sqlite.Database(__dirname + '/database/db.sqlite', function(err) {
    if (err) return cb(err);
    METHODS.forEach(exposeMethod);
    cb();
  });
};

