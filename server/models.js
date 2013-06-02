var models = module.exports;

var async = require('async');
var logger = require('just-logging').getLogger();

var database = require('./database');

function getTableName(model) {
  return model.constructor.name.toLowerCase() + 's';
}

models.save = function(model, cb) {
  if (!model.id) return models.insert(model, cb);
};

models.insert = function(model, cb) {
  var table = getTableName(model);
  var fields = model.constructor.FIELDS;

  var columns = [];
  var placeholders = [];
  var values = [];

  for (var i = 0; i < fields.length; ++i) {
    var field = fields[i];
    if (model[field] !== undefined) {
      columns.push(field);
      placeholders.push('?');
      values.push(model[field]);
    }
  }

  var query = 'INSERT INTO ' + table + ' (' +
    columns.join(',') + ') VALUES (' +
    placeholders.join(',') + ')';

  logger.debug('Executing query', query);

  function insert(cb) {
    database.run.apply(database, [query].concat(values).concat(cb));
  }

  async.series([
    insert,
    database.get.bind(database, 'SELECT last_insert_rowid() FROM ' + table)
  ], function(err, results) {
    if (err) return cb(err);

    var id = results[1]['last_insert_rowid()'];
    logger.debug('Insert successful, setting id to', id);

    model.id = id;
    cb(null, model);
  });
};

models.load = function(model, id, cb) {

};
