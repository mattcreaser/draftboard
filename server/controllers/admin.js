var admin = module.exports;
var logger = require('just-logging').getLogger();
var async = require('async');

var database = require('../database');
var Drafter = require('../models/Drafter');

admin.get = function(req, res) {

  // Get all of the user's drafts.
  // TODO : limit drafts to current logged-in user.
  database.all('SELECT * FROM drafts ORDER BY drafts.id', function(err, drafts) {
    if (err) return res.send(500);

    // TODO : This should be done with a JOIN instead of nested SELECTs.
    async.each(drafts, function(draft, cb) {
      database.all('SELECT * FROM drafters WHERE drafters.draft = ? ORDER BY drafters.slot', draft.id, function(err, drafters) {
        if (err) return cb(err);
        draft.drafters = drafters;
        cb();
      });
    }, function(err) {
      if (err) return res.send(500);
      res.render('admin', { drafts: drafts });
    });
  });
};

/**
 *
 */
admin.post = function(req, res) {
  var name = req.body.name;
  var joinUrl = 'http://www.something.com/1234';
  var draft = req.body.draft;

  logger.debug('Adding', name, 'to draft', draft);

  var drafter = new Drafter({
    name: name,
    draft: draft,
    joinUrl: joinUrl,
    slot: 0
  });

  drafter.save(function(err) {
    if (err) {
      logger.error('Could not add drafter:', err);
      return res.send(500);
    }
    res.redirect('/admin');
  });
};
