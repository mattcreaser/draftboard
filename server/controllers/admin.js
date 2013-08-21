var admin = module.exports;
var logger = require('just-logging').getLogger();
var async = require('async');
var hat = require('hat');

var models = require('../models');
var auth = require('../lib/auth');
var email = require('../lib/email');

// Use a hat rack to generate unique join URLs for new drafter instances. The
// rack checks for collisions.
var rack = hat.rack();

admin.get = function(req, res) {
  models.drafter.find(['slot'], function(err, drafters) {
    if (err) return res.status(500).send(err);

    res.render('admin', { drafters: drafters });
  });
};

/**
 *
 */
admin.post = function(req, res) {
  var name = req.body.name;
  var slot = req.body.slot;
  var joinId = rack();

  models.drafter.create({
    name: name,
    joinId: joinId,
    slot: slot,
    draft_id: 4
  }, function(err, items) {

    if (err) return res.status(500).send(err);

    res.redirect('/admin');

  });
};

/**
 *
 */
admin.invite = function(req, res) {
  var joinId = req.body.joinId;
  var address = req.body.email;

  email.send(address, joinId, function(err) {
    if (err) {
      console.error('Unable to send email', err);
      return res.status(500).send();
    }

    console.log('Invitation email sent to', address);
    res.redirect('/admin');
  });
};

admin.initialize = function(app, cb) {
  app.get('/admin', auth.middleware, admin.get);
  app.post('/admin', auth.middleware, admin.post);
  app.post('/admin/invite', auth.middleware, admin.invite);
  cb();
};
