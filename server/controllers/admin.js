var admin = module.exports;
var logger = require('just-logging').getLogger();
var database = require('../database');

admin.get = function(req, res) {

  // Get all of the user's drafts.
  // TODO : limit drafts to current logged-in user.
  database.all('SELECT * FROM drafts ORDER BY drafts.id', function(err, drafts) {
    if (err) return res.send(500);

    console.dir(drafts);


    res.render('admin', { drafts: drafts});
  });
};
