/*jshint node:true */
'use strict';

var async = require('async');
var logger = require('just-logging').getLogger();
var _ = require('lodash');
var models = require('../models');

var draft = module.exports;

draft._cache = {};

/**
 *
 */
draft.initialize = function(app, cb) {
  draft.io = app.io;
  cb();
};

/**
 *
 */
draft.byId = function(id, cb) {
  if (draft._cache[id]) {
    return cb(null, draft._cache[id]);
  }

  draft._cache[id] = new Draft(id);
  draft._cache[id].init(cb);
};

/**
 *
 */
function Draft(id) {
  this._id = id;
}

/**
 *
 */
Draft.prototype.init = function(cb) {
  var self = this;

  function loadModel(next) {
    models.draft.get(self._id, next);
  }

  function loadPicks(model, next) {
    self._model = model;
    self._model.getPicks(next);
  }

  function loadDrafters(picks, next) {
    self._picks = picks;
    self._model.getDrafters(next);
  }

  function loadPlayers(drafters, next) {
    self._drafters = drafters;
    models.player.find(['lastname', 'firstname'], next);
  }

  function filterPlayers(players, next) {
    _.each(self._picks, function(pick) {
      players = _.reject(players, { id: pick.player_id });
    });

    self._remainingPlayers = players;
    next();
  }

  var complete = function(err) {
    if (err) return cb(err);

    // The draft has already started if the model has a start time.
    this._started = !!this._model.start;

    // There is one slot per drafter.
    this._numSlots = this._drafters.length;

    this._pickStartTime = null;

    var numPicks = this._picks.length;
    this._round = Math.floor(numPicks / this._numSlots);
    var snaking = (this._round % 2) === 1;
    this._slot = numPicks % this._numSlots;
    if (snaking) {
      this._slot = this._numSlots - this._slot;
    }

    // Instantiate the realtime room.
    this.room = draft.io.room('draft-' + this._id);

    cb(null, this);
  }.bind(this);

  async.waterfall(
    [loadModel, loadPicks, loadDrafters, loadPlayers, filterPlayers],
    complete);
};

/**
 *
 */
Draft.prototype.addPicker = function(connection, cb) {
  connection.join('draft-' + this._model.id);

  // Nothing else to do if the draft hasn't started yet.
  if (!this._started) {
    return cb();
  }

  // Do the callback first so they get the ready response.
  // TODO: This is kind of messed up.
  cb();

  // Send a list of remaining players.
  connection.emit('draft:remainingPlayers', {
    players: this._remainingPlayers
  });

  // Let the picker know who is picking.
  var elapsedTime = Date.now() - this._pickStartTime;
  connection.emit('draft:nowPicking', {
    slot: this._slot,
    round: this._round,
    elapsedTime: elapsedTime
  });
};

/**
 * Adds a board to the draft. This sends some information about the current
 * status of the draft to the board, and registers it to receive additional
 * information.
 */
Draft.prototype.addBoard = function(connection, cb) {
  // Put the board in the room so it will receive all further broadcast
  // messages.
  connection.join('draft-' + this._model.id);

  // Nothing else to do if the draft hasn't started yet.
  if (!this._started) {
    return cb();
  }

  // TODO: Send the board all of the picks made so far.

  cb();

  // Let the board know who is picking.
  var elapsedTime = Date.now() - this._pickStartTime;
  connection.emit('draft:nowPicking', {
    slot: this._slot,
    round: this._round,
    elapsedTime: elapsedTime
  });
};

/**
 *
 */
Draft.prototype.start = function(cb) {
  logger.debug('Starting draft', this._id);

  this._model.start = Date.now();

  var self = this;

  this._model.save(function(err) {
    if (err) {
      logger.error('Could not start draft', err);
      return cb(err);
    }

    logger.debug('Draft started', self._id);

    self._slot = 0;
    self._round = 0;
    self._started = true;

    self.sendNowPicking();

    cb();
  });
};

/**
 *
 */
Draft.prototype.pick = function(drafter, player, cb) {
  var self = this;

  logger.debug('Saving pick', player, 'round', this._round, 'slot', this._slot);

  if (!this._started) {
    logger.error('Pick received before draft has started');
    return cb(new Error('Draft has not yet started'));
  }

  // Make sure the drafter is allowed to make this pick.
  if (drafter.slot !== this._slot && !drafter.isAdmin) {
    logger.error('Drafter is not allowed to pick for this slot');
    return cb(new Error('You are not allowed to pick for this slot.'));
  }

  function checkPlayerAvailable(next) {
    var where = { player_id: player.id, draft_id: self._id };

    models.pick.count(where, function(err, count) {
      if (err) { return next(err); }
      if (count > 0) { return next(new Error('Player is already picked.')); }

      // Player is not picked, return no error and allow pick to continue.
      next();
    });
  }

  function makePick(next) {
    var data = {
      round: self._round,
      slot: self._slot,
      player_id: player.id,
      draft_id: self._id
    };

    models.pick.create(data, next);
  }

  // Make the pick.
  async.series([checkPlayerAvailable, makePick], function(err, items) {
    if (err) {
      logger.error('Unable to save pick', err);
      self.room.broadcast('draft:error', 'Unable to save pick');
      return cb(err);
    }

    self._picks = self._picks.concat(items);
    self._remainingPlayers = _.reject(self._remainingPlayers, player);

    logger.debug('Pick saved');

    self.room.broadcast('draft:pickMade', {
      player: player,
      round: self._round,
      slot: self._slot
    });

    self.advanceToNextSlot();

    cb();
  });
};

/**
 *
 */
Draft.prototype.advanceToNextSlot = function() {
  // Are we snaking (going down) or not (going up)?
  var snaking = (this._round % 2) === 1;

  if (this._slot === 0 && snaking ||
      this._slot === (this._numSlots - 1) && !snaking) {
    // If we've reached the end of the round just advance the round and keep
    // the slot the same.
    this._round++;
  } else {
    // Otherwise keep the round the same and advance the slot.
    this._slot += (snaking) ? -1 : 1;
  }

  logger.debug('Draft slot advanced to round', this._round, 'slot', this._slot);

  this.sendNowPicking();
};

/**
 *
 */
Draft.prototype.sendNowPicking = function() {
  // Record the start time of the current pick.
  this._pickStartTime = Date.now();

  var drafter = this._drafters[this._slot];

  // Let the participants know who is now on the clock.
  this.room.broadcast('draft:nowPicking', {
    slot: this._slot,
    round: this._round,
    name: drafter.name,
    elapsedTime: 0 // There is never elapsed time when the pick first starts.
  });
};
