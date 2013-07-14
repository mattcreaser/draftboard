var join = module.exports;

var models = require('../models');
var logger = require('just-logging').getLogger();

join.get = function(req, res) {
  var id = req.params.id;

  if (!id) {
    logger.warn('Missing join id');
    return res.send(403);
  }

  models.drafter.find({ joinId: id }, function(err, drafters) {
    if (err) {
      logger.error('Database error retrieving drafter for join ID', id, err);
      return res.send(500);
    }

    if (!drafters || drafters.length <= 0) {
      logger.warn('No drafters found for join ID', id);
      return res.send(403);
    }

    if (drafters.length > 1) {
      logger.error('More than one drafter found with join id', id);
      return res.send(500);
    }

    // Save the drafter object in the session.
    req.session.drafter = drafters[0];

    // Redirect to the draft page.
    res.redirect('/draft');
  });
};

join.get.param = 'id';
