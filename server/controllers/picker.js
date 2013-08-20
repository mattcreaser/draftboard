/**
 * @fileOverview
 * This file contains the controller for the draft page, which is where
 * individual drafters make their selections during a draft.
 */

var picker = module.exports;

var async = require('async');
var _ = require('lodash');
var logger = require('just-logging').getLogger();

var models = require('../models');
var draft = require('../realtime/draft');

picker.get = function(req, res) {
  res.render('picker', {
    drafter: req.session.drafter
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

    var draftId = drafter.draft.id;

    function getDraft(next) {
      draft.byId(drafter.draft.id, next);
    }

    function addPicker(realtimeDraft, next) {
      realtimeDraft.addPicker(req.io, next);
    }

    async.waterfall([getDraft, addPicker], function(err) {
      if (err) { return req.io.respond({ error: err }); }
      req.io.respond({ info: drafter });
    });
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

    function getDraft(next) {
      draft.byId(drafter.draft.id, next);
    }

    function makePick(realtimeDraft, next) {
      realtimeDraft.pick(drafter, player, next);
    }

    async.waterfall([getDraft, makePick], function(err) {
      if (err) { return req.io.respond({ error: err} ) }

      req.io.respond({});
    });
  },

  createPlayer: function(req) {
    var drafter = req.session.drafter;
    var player = req.data;

    if (!drafter) {
      logger.error('No drafter model found in session for pick route');
      return req.io.respond({ error: 'No drafter model'});
    }

    if (!player) {
      logger.error('No player in create message');
      return req.io.respond({ error: 'No player specified' });
    }

    if (!drafter.isAdmin) {
      logger.error('Drafter is not admin in createPlayer');
      return req.io.respond({
        error: 'You must be an admin to create a player'
      });
    }

    // TODO : Validate player.

    models.player.create(player, function(err) {
      if (err) {
        logger.error('Error creating player', err);
        return req.io.respond({ error: err.message });
      }

      return req.io.respond({});
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

    function getDraft(next) {
      draft.byId(drafter.draft.id, next);
    }

    function startDraft(realtimeDraft, next) {
      realtimeDraft.start(next);
    }

    async.waterfall([getDraft, startDraft], function(err) {
      if (err) { return req.io.respond({ error: err} ) }

      req.io.respond({});
    });
  }

};
