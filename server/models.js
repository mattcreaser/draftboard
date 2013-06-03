var models = module.exports;

var orm = require('orm');
var fs = require('fs');
var async = require('async');

var logger = require('just-logging').getLogger();

/**
 * The location od the database file.
 * @todo This should come from database.js
 */
const PATH_TO_DB = __dirname + '/database/db.sqlite';

/**
 * A regex used to identify javascript files.
 */
const JAVASCRIPT_FILE_REGEX = /\.js$/;

/**
 * Loads the model defined in the given file into the ORM system.
 */
function loadModel(db, fileName, cb) {
  // Skip any non-js files in the models directory (such as vim swap files)
  if (!fileName.match(JAVASCRIPT_FILE_REGEX)) {
    logger.debug('Skipping non-model file ' + fileName);
    return cb();
  }

  // Strip the .js suffix to get the module name.
  var moduleName = fileName.replace(JAVASCRIPT_FILE_REGEX, '');

  // Load the module into ORM.
  logger.debug('Loading model ' + moduleName);
  db.load(__dirname + '/models/' + moduleName, function(err) {
    if (err) {
      logger.error('Error loading model', moduleName, ':',  err);
      return cb(err);
    }
    logger.debug('Loaded model ' + moduleName);
    cb();
  });
}

/**
 * The initialize function for the models subsystem. Connects to the database
 * with the ORM module and then loads all the files in ./models into the
 * ORM system.
 */
models.initialize = function(cb) {
  logger.debug('Opening database at', PATH_TO_DB);
  orm.connect('sqlite://' + PATH_TO_DB, function(err, db) {
    if (err) return cb(err);
    // Retrieve a file list of the ./models directory.
    fs.readdir(__dirname + '/models', function(err, files) {
      if (err) return cb(err);
      // Asynchronously load each model into the ORM object.
      async.each(files, loadModel.bind(null, db), cb);
    });
  });
};

