var login = module.exports;

login.get = function(req, res) {
  res.render('login');
};

login.post = function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  // TODO : Authenticate login.

  res.redirect('/admin');
};
