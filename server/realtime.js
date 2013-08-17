/*jshint node:true */
'use strict';
var realtime = module.exports;

var path = require('path');
var logger = require('just-logging').getLogger();
var autoLoader = require('auto-loader');

var REALTIME_PATH = path.join(__dirname, '/realtime');

/**
 *
 */
realtime.initialize = function(app, cb) {

  var realtimes = autoLoader.load(REALTIME_PATH);

  realtimes.draft.initialize(app, cb);
};
