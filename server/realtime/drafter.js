/*jshint node:true */
'use strict';

var _ = require('lodash');
var logger = require('just-logging').getLogger();

var draft = require('./draft');

var drafter = module.exports;

drafter.routes = {};
drafter._cache = {};

drafter.routes.ready = function(req) {
  if (!req.session || !req.session.drafter) {
    logger.error('No drafter model found in session for ready route');
    return req.io.emit('drafter:error', 'No drafter model');
  }

  var id = req.session.drafter.id;

  // Destroy the existing realtime drafter
  if (drafter._cache[id]) {
    drafter._cache[id].destroy();
  }

  drafter._cache[id] = new RealtimeDrafter(req.session.drafter, req.io);
  req.session.realtimeDrafter = drafter._cache[id];
};

function makeHandler(route) {
  drafter.routes[route] = function(req) {
    if (!req.session || !req.session.realtimeDrafter) {
      logger.error('No realtimedrafter found for', route);
      return req.io.emit('drafter:error');
    }

    var realtimeDrafter = req.session.realtimeDrafter;
    realtimeDrafter[route].call(realtimeDrafter, req);
  };
}

var ROUTES = ['pick'];
ROUTES.forEach(makeHandler);

/**
 *
 */
function RealtimeDrafter(model, connection) {
  this._model = model;
  this._connection = connection;

  this._draft = draft.byModel(this._model.draft);
  this._draft.add(this);

  _.bindAll(this, 'pick');
}

/**
 *
 */
RealtimeDrafter.prototype.destroy = function() {
  this._draft.remove(this);
};

/**
 *
 */
RealtimeDrafter.prototype.pick = function(req) {
  var player = req.data;
  this._draft.pick(this, player, function(err) {
    if (err) {
      this._connection.emit('drafter:error', err.message);
    }
  }.bind(this));
};

RealtimeDrafter.prototype.getSlot = function() {
  return this._model.slot;
};

RealtimeDrafter.prototype.isAdmin = function() {
  return this._model.isAdmin;
};
