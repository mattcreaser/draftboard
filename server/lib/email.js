/*jshint node:true */
'use strict';

/**
 * @fileOverview
 * Sends the draft join emails via nodemailer.
 */

var nodemailer = require('nodemailer');
var url = require('url');

var config = require('../config/config');

var email = module.exports;

var transport = nodemailer.createTransport('SMTP', {
  service: 'gmail',
  auth: {
    user: config.gmail.user,
    pass: config.gmail.password
  }
});

email.send = function(address, joinId, cb) {

  var loc = url.format({
    protocol: config.server.protocol,
    hostname: config.server.domain,
    port: config.server.port,
    pathname: 'join/' + joinId
  });

  var mailOptions = {
    from: config.gmail.user,
    to: address,
    subject: 'Halifax FF Friendly Draft',
    html: '<p>Join the draft by visiting <a href="' + loc + '">' + loc +
          '</a></p>'
  };

  console.log('Email options:', mailOptions);

  transport.sendMail(mailOptions, function(err) {
    transport.close();
    cb(err);
  });

};
