/**
 * @fileOverview
 * This file contains the controller for the draft page, which is where
 * individual drafters make their selections during a draft.
 */

var picker = module.exports;

var _ = require('lodash');
var logger = require('just-logging').getLogger();

var models = require('../models');
var draft = require('../realtime/draft');

picker.get = function(req, res) {
  models.player.find(['lastname', 'firstname'], function(err, players) {
    if (err) {
      return res.status(500).send();
    }

    players = _.groupBy(players, function(player) { return player.position; });

    res.render('picker', {
      drafter: req.session.drafter,
      players: players
    });
  });
};

picker.middleware = function(req, res, next) {
  if (!req.session.drafter) {
    logger.warn('No drafter found in session');
    return res.send(403);
  }

  next();
};

picker.initialize = function(app, cb) {
  app.get('/picker', picker.middleware, picker.get);

  // Any picker:<event> realtime events should be routed to the functions
  // defined in picker.realtime
  app.io.route('picker', picker.realtime);

  cb();
};

picker.realtime = {

  /**
   *
   */
  ready: function(req) {
    var drafter = req.session.drafter;

    if (!drafter) {
      logger.error('No drafter model found in session for ready route');
      return req.io.respond({ error: 'No drafter model'});
    }

    // TODO : Respond with list of eligible players
    req.io.respond({ players: [] });

    var realtimeDraft = draft.byModel(drafter.draft);
    realtimeDraft.addPicker(req.io);
  },

  /**
   *
   */
  pick: function(req) {
    var drafter = req.session.drafter;
    var player = req.data;

    if (!drafter) {
      logger.error('No drafter model found in session for pick route');
      return req.io.respond({ error: 'No drafter model'});
    }

    var realtimeDraft = draft.byModel(drafter.draft);

    realtimeDraft.pick(drafter, player, function(err) {
      if (err) {
        return req.io.respond({ error: err.message });
      }

      // Send an empty respond to indicate that no error occurred.
      req.io.respond();
    });
  },

  /**
   *
   */
  startDraft: function(req) {
    var drafter = req.session.drafter;

    if (!drafter) {
      logger.error('No drafter model found in session for startDraft route');
      return req.io.respond({ error: 'No drafter model' });
    }

    if (!drafter.isAdmin) {
      logger.error('Drafter must be admin to start the draft');
      return req.io.respond({ error: 'Must be admin to start draft' });
    }

    var realtimeDraft = draft.byModel(drafter.draft);

    realtimeDraft.start(function(err) {
      if (err) {
        return req.io.respond({ error: err.message });
      }

      req.io.respond();
    });
  }

};
