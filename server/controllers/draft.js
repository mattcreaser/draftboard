/**
 * @fileOverview
 * This file contains the controller for the draft page, which is where
 * individual drafters make their selections during a draft.
 */

var draft = module.exports;

var _ = require('lodash');
var logger = require('just-logging').getLogger();

var models = require('../models');

draft.get = function(req, res) {
  models.player.find(['lastname', 'firstname'], function(err, players) {
    if (err) {
      return res.status(500).send();
    }

    players = _.groupBy(players, function(player) { return player.position; });

    res.render('draft', {
      drafter: req.session.drafter,
      players: players
    });
  });
};

draft.middleware = function(req, res, next) {
  if (!req.session.drafter) {
    logger.warn('No drafter found in session');
    return res.send(403);
  }

  next();
};

draft.initialize = function(app, cb) {
  app.get('/draft', draft.middleware, draft.get);
  cb();
};
