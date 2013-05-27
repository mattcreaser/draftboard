var fs = require('fs');
var async = require('async');
var logger = require('just-logging').getLogger();

const JAVASCRIPT_FILE_REGEX = /\.js$/;

function initializeController(app, fileName, cb) {
  // Skip any non-js files in the controller directory (such as vim swap files)
  if (!fileName.match(JAVASCRIPT_FILE_REGEX)) {
    logger.debug('Skipping non-controller file ' + fileName);
    return cb();
  }

  // Strip the .js suffix to get the module name.
  var moduleName = fileName.replace(JAVASCRIPT_FILE_REGEX, '');

  // Load the module.
  var controller = require('./controllers/' + moduleName);

  // Map the GET method for the controller if it exists.
  if (controller.get) {
    logger.info('Mapping GET for /' + moduleName + ' controller');
    app.get('/' + moduleName, controller.get);
  }

  // Map the POST method for the controller if it exists.
  if (controller.post) {
    logger.info('Mapping POST for /' + moduleName + ' controller');
    app.post('/' + moduleName, controller.post);
  }

  // If the controller exposes an initialize method then call that. Otherwise
  // there's nothing left to do so call the callback directly.
  if (controller.initialize) {
    logger.debug('Initializing controller', moduleName);
    controller.initialize(app, cb);
  } else {
    cb();
  }
}

module.exports.initialize = function(app, cb) {
  // Get a list of all the files in the controllers directory.
  fs.readdir(__dirname + '/controllers', function(err, files) {
    // Loop over the files and initialize each controller.
    async.each(files, initializeController.bind(null, app), cb);
  });
};
