/**
 * @fileOverview
 */

var _ = require('lodash');

var models = require('../models');

function Drafter(data) {
  _.each(Drafter.FIELDS, function(field) {
    this[field] = data[field];
  }.bind(this));

  this.id = data.id;
}

Drafter.prototype.save = function(cb) {
  models.save(this, cb);
};

Drafter.prototype.load = function(cb) {
  models.load(this, cb);
};

Drafter.FIELDS = [
  'draft',
  'name',
  'slot',
  'joinUrl',
  'email'
];

module.exports = Drafter;
