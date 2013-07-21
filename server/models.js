var models = module.exports;

var orm = require('orm');
var fs = require('fs');
var async = require('async');
var _ = require('lodash');

var logger = require('just-logging').getLogger();

/**
 * The location od the database file.
 * @todo This should come from database.js
 */
const PATH_TO_DB = __dirname + '/database/db.sqlite';

/**
 * Create the model definitions, set up associations, and sync the tables in
 * the database.
 */
function defineModels(db, cb) {

  var account = models.account = db.define('account', {
    email: String,
    password: String
  });

  // A draft is a single instance of a draft.
  var draft = models.draft = db.define('draft', {
    pick: Number,
    pickStart: Date,
    start: Date
  });

  // A drafter is an individual drafting a single team.
  var drafter = models.drafter = db.define('drafter', {
    name: String,
    slot: Number,
    joinId: String,
    email: String,
    isAdmin: Boolean
  });

  var player = models.player = db.define('player', {
    firstname: String,
    lastname: String,
    team: String,
    position: String
  });

  // There are many drafters to one draft.
  //drafter.hasOne('draft', draft, { reverse: 'drafters', required: true });

  async.each(_.toArray(models), function(model, next) {
    model.sync(next);
  }, cb);
}

/**
 * The initialize function for the models subsystem. Connects to the database
 * with the ORM module and then loads all the files in ./models into the
 * ORM system.
 */
models.initialize = function(app, cb) {
  delete models.initialize;
  logger.debug('Opening database at', PATH_TO_DB);
  orm.connect('sqlite://' + PATH_TO_DB, function(err, db) {
    if (err) return cb(err);
    defineModels(db, cb);
  });
};

