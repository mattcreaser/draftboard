/*jshint node:true */
'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var autoLoader = require('auto-loader');
var _ = require('lodash');
var logger = require('just-logging').getLogger();


module.exports.initialize = function(app, cb) {
  var controllersPath = path.join(__dirname, '/controllers');

  logger.debug('Loading controllers from', controllersPath);
  var controllers = autoLoader.load(controllersPath);
  controllers = _.toArray(controllers);

  async.each(controllers, function(controller, next) {
    if (_.isString(controller)) {
      return next();
    }

    controller.initialize(app, next);
  }, cb);
};
