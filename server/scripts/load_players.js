#!/usr/bin/env node

/* jshint node:true */
'use strict';

/**
 * @fileOverview
 * Contains a script used for loading a players.txt file into the database.
 *
 * The file is assumed to contain one player per line in the following format:
 * Firstname SPACE Lastname(s) SPACE Team abbrev. SPACE DASH SPACE Pos abbrev.
 * e.g.
 * Fred Davis WAS - TE
 */

var path = require('path');
var lineReader = require('line-reader');
var program = require('commander');

var models = require('../models.js');

var DEFAULT_FILE = './players.txt';
var REGEX = /^(\S+) (.*) (\w+) - (\w+)$/;

function readFile(filename) {
  filename = filename || DEFAULT_FILE;

  var where = path.join(__dirname, filename);
  console.log('Reading file:', where);

  lineReader.eachLine(where, function(line) {
    console.log('Processing', line);

    var matches = line.match(REGEX);

    if (!matches || matches.length < 5) {
      console.log('Could not process', line);
      process.exit(1);
    }

    var player = {
      firstname: matches[1],
      lastname: matches[2],
      team: matches[3],
      position: matches[4]
    };

    models.player.exists(player, function(err, exists) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      if (exists) {
        console.log('Player already exists, skipping', player);
        return;
      }

      models.player.create(player, function(){});
    });
  });
}

function exec(filename) {
  models.initialize(null, function(err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    readFile(filename);
  });
}

program
.command('load [filename]')
.description('Load a player list into the database')
.action(exec);

program.parse(process.argv);

