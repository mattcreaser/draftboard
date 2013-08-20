/**
 * @fileOverview
 * This file contains the controller for the board page, which is the page
 * shown on the tv during the draft.
 */

var async = require('async');
var logger = require('just-logging').getLogger();
var draft = require('../realtime/draft');

var board = module.exports;

var models = require('../models');

board.get = function(req, res) {
  var draftId = 4;

  models.draft.get(draftId, function(err, draft) {
    if (err) {
      return res.status(500).send();
    }

    req.session.draftInfo = draft;

    res.render('board');
  });
};

board.initialize = function(app, cb) {
  app.get('/board', board.get);

  app.io.route('board', board.realtime);

  cb();
};

board.realtime = {
  ready: function(req) {
    if (!req.session || !req.session.draftInfo) {
      logger.error('No draft info found in session for ready route');
      return req.io.emit('board:error', 'No draft info');
    }

    var info = req.session.draftInfo;

    function getRealtimeDraft(next) {
      draft.byId(info.id, next);
    }

    function addBoard(realtimeDraft, next) {
      realtimeDraft.addBoard(req.io, next);
    }

    async.waterfall([getRealtimeDraft, addBoard], function(err) {
      if (err) {
        return req.io.respond({ error: err });
      }

      // Board is registered with draft.
      req.io.respond({});
    });
  }
};
