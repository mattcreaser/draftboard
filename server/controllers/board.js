/**
 * @fileOverview
 * This file contains the controller for the board page, which is the page
 * shown on the tv during the draft.
 */

var board = module.exports;

var models = require('../models');

board.get = function(req, res) {
  var draftId = 4;

  models.draft.get(draftId, function(err, draft) {
    if (err) {
      return res.status(500).send();
    }

    req.session.draft = draft;

    res.render('board');
  });
};

board.initialize = function(app, cb) {
  app.get('/board', board.get);
  cb();
};
