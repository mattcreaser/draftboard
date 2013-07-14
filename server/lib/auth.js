/**
 * @fileOverview
 * This file contains authentication functionality.
 */

var bcrypt = require('bcrypt');
var models = require('../models.js');

var auth = module.exports;

/**
 * Verifies login information.
 * @param {string} email The email address of the account
 * @param {string} password The password of the account
 * @param {function(err, account)} cb The callback for when verification
 *        completes.
 */
auth.verify = function(email, password, cb) {
  models.account.find({ email: email }, function(err, accounts) {
    if (err) return cb(err);

    if (accounts.length !== 1) {
      return cb(new Error('Account not found'));
    }

    var account = accounts[0];

    bcrypt.compare(password, account.password, function(err, match) {
      if (err) return cb(err);
      if (!match) return cb(new Error('Password does not match'));
      return cb(null, account);
    });
  });
};

/**
 * Middleware that checks to see if the session has previously logged in.
 */
auth.middleware = function(req, res, next) {
  if (!req.session.account) return res.send(403);
  next();
};
