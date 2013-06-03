/**
 * @fileOverview
 */

module.exports = function(db, cb) {

  db.define('drafter', {
    name: String,
    slot: Number,
    joinUrl: String,
    email: String
  });

  return cb();
};
