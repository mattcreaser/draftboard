/*jshint node:true */
'use strict';

var logger = require('just-logging').getLogger();

var models = require('../models');

var draft = module.exports;

draft._cache = {};

draft.initialize = function(app, cb) {
  draft.io = app.io;
  cb();
};

draft.byModel = function(model) {
  var id = model.id;

  if (!draft._cache[id]) {
    draft._cache[id] = new Draft(model);
  }

  return draft._cache[id];
};

/**
 *
 */
function Draft(model) {
  this._model = model;

  // The draft has already started if the model has a start time.
  this._started = !!this._model.start;

  // There is one drafter per slot.
  //this._numSlots = this._model.drafters.length;
  this._numSlots = 12;

  // If we haven't started, default the pick to 0. Otherwise it is based on
  // how many picks have been made.
  //var pickNum = this._started ? this._model.picks.length + 1 : 0;

  this._round = 0;
  this._slot = 0;

  this._pickStartTime = null;

  this.room = draft.io.room('draft-' + this._model.id);
}

/**
 *
 */
Draft.prototype.addPicker = function(connection) {
  connection.join('draft-' + this._model.id);

  // Nothing else to do if the draft hasn't started yet.
  if (!this._started) {
    return;
  }

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
Draft.prototype.addBoard = function(connection) {
  // Put the board in the room so it will receive all further broadcast
  // messages.
  connection.join('draft-' + this._model.id);

  // Nothing else to do if the draft hasn't started yet.
  if (!this._started) {
    return;
  }

  // TODO: Send the board all of the picks made so far.

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
Draft.prototype.remove = function(drafter) {
  drafter._connection.leave('draft-' + this._model.id);
};

/**
 *
 */
Draft.prototype.start = function(cb) {
  this._model.start = Date.now();

  var self = this;

  this._model.save(function(err) {
    if (err) {
      logger.error('Could not start draft', err);
      return cb(err);
    }

    self._slot = 1;
    self._round = 1;

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

  // TODO : Ensure player is available to be picked.

  // Make the pick.
  models.pick.create({
   round: this._round,
   slot: this._slot,
   player_id: player.id,
   draft_id: this._model.id
  }, function(err, items) {
    if (err) {
      logger.error('Unable to save pick', err);
      self.room.broadcast('draft:error', 'Unable to save pick');
      return cb(err);
    }

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
  var snaking = (this._round % 2) === 0;

  if (this._slot === 1 && snaking || this._slot === 12 && !snaking) {
    // If we've reached the end of the round just advance the round and keep
    // the slot the same.
    this._round++;
  } else {
    // Otherwise keep the round the same and advance the slot.
    this._slot += (snaking) ? -1 : 1;
  }

  this.sendNowPicking();
};

/**
 *
 */
Draft.prototype.sendNowPicking = function() {
  // Record the start time of the current pick.
  this._pickStartTime = Date.now();

  // Let the participants know who is now on the clock.
  this.room.broadcast('draft:nowPicking', {
    slot: this._slot,
    round: this._round,
    elapsedTime: 0 // There is never elapsed time when the pick first starts.
  });
};
