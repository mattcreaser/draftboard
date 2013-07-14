var admin = module.exports;
var logger = require('just-logging').getLogger();
var async = require('async');
var hat = require('hat');

var models = require('../models');
var auth = require('../lib/auth');

// Use a hat rack to generate unique join URLs for new drafter instances. The
// rack checks for collisions.
var rack = hat.rack();

admin.get = function(req, res) {
  models.drafter.find(function(err, drafters) {
    if (err) return res.status(500).send(err);

    res.render('admin', { drafters: drafters });
  });
};

admin.get.middleware = auth.middleware;

/**
 *
 */
admin.post = function(req, res) {
  var name = req.body.name;
  var joinId = rack();

  models.drafter.create({
    name: name,
    joinId: joinId,
    slot: 0
  }, function(err, items) {

    if (err) return res.status(500).send(err);

    res.redirect('/admin');

  });
};

admin.post.middleware = auth.middleware;
