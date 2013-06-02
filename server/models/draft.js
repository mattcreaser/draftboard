/**
 * @fileOverview
 * This file contains the draft model.
 * TODO ...
 */

var async = require('async');
var logger = require('just-logging').getLogger();

var database = require('../database');

/**
 * @constructor
 */
var Draft = function(name, id) {
  this.name = name;
  this.id = id;
};

Draft.prototype.save = function(cb) {
  if (!this.id) return this.insert(cb);

  database.run('UPDATE drafts SET name = ? WHERE id = ?', this.name, this.id, cb);
};

Draft.prototype.insert = function(cb) {
  async.series([
    database.run.bind(database, 'INSERT INTO drafts (name) VALUES ?', this.name),
    database.get.bind(database, 'SELECT last_insert_rowid() FROM drafts')
  ], function(err, result) {
    if (err) return cb(err);
    this.id = result.id;
    cb();
  }.bind(this));
};

Draft.fromId = function(id, cb) {
  database.get('SELECT * FROM drafts WHERE id = ?', id, function(err, row) {
    if (err) {
      return cb(err);
    }

    cb(null, new Draft(row.name, row.id));
  });
};

module.exports = Draft;
