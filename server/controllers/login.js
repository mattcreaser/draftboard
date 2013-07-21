/**
 * @fileOverview
 * This file is the controller for the login view.
 */

var auth = require('../lib/auth');

var login = module.exports;

login.get = function(req, res) {
  res.render('login');
};

login.post = function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  auth.verify(email, password, function(err, account) {
    if (err) {
      res.send(403);
    }

    req.session.account = account;
    res.redirect('/admin');
  });
};

login.initialize = function(app, cb) {
  app.get('/login', login.get);
  app.post('/login', login.post);
  cb();
};
