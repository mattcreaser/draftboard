/*jshint node:true */
'use strict';

var logger = require('just-logging').getLogger();

var draft = require('./draft');

var board = module.exports;

board.routes = {};

board.routes.ready = function(req) {
  if (!req.session || !req.session.draft) {
    logger.error('No board model found in session for ready route');
    return req.io.emit('board:error', 'No draft model');
  }

  var model = req.session.draft;

  var realtimeDraft = draft.byModel(model);

  realtimeDraft.addBoard(req.io);
};
