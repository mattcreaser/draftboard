/**
 * @fileOverview
 * This file contains the controller for the draft page, which is where
 * individual drafters make their selections during a draft.
 */

var draft = module.exports;

var logger = require('just-logging').getLogger();

draft.get = function(req, res) {
  if (!req.session.drafter) {
    logger.warn('No drafter found in session');
    return res.send(403);
  }

  res.render('draft', {
    drafter: req.session.drafter
  });
};
