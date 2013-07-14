var expressio = require('express.io');
var async = require('async');
var logger = require('just-logging').getLogger();
var engine = require('ejs-locals');

var config = require('./config/config');

var app = expressio();
app.http().io();

app.configure(function() {
  console.log(__dirname);

  var maxAge = 365 * 24 * 60 * 60 * 1000; // one year.
  app.use('/static', expressio.static(__dirname + '/../client'), { maxAge: maxAge });

  app.use(expressio.cookieParser());
  app.use(expressio.session({ secret: 'draftboard' }));

  app.use(expressio.bodyParser());

  app.engine('ejs', engine);
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');

});

const INITIALIZATION_MODULES = ['authentication', 'controllers', 'models'];

/**
 * Helper function for module initialization. Each module MUST have an
 * initialize method.
 */
function initializeModule(moduleName, cb){
  logger.debug('Initializing ' + moduleName);

  try {
    var module = require('./' + moduleName);
    if (!module.initialize) {
      cb('Module ' + moduleName + ' is missing an initialize function');
    }
    module.initialize(app, cb);
  } catch (err) {
    cb('Unable to load module ' + moduleName + ': ' + err.message);
  }
}

// Initialize each module in order.
async.eachSeries(INITIALIZATION_MODULES, initializeModule, function(err) {

  if (err) { logger.error('Unable to start server:', err); return; }

  var port = config.server.port;
  logger.info('Initialization complete. Listening for connections on port', port);
  app.listen(port);

});
