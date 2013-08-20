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
var REGEX = /^([-\w\s\.\']+), (\w+), (\w+)$/;

function insertPlayer(player) {
  models.player.exists(player, function(err, exists) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    if (exists) {
      if (program.verbose) {
        console.log('Player already exists, skipping', player);
      }
      return;
    }

    //console.log('Creating player', player);
    models.player.create(player, function(err){
      if (err) {
        console.error('Could not create player', player, err);
      }
    });
  });
}

function readFile(filename) {
  filename = filename || DEFAULT_FILE;

  var where = path.join(__dirname, filename);
  console.log('Reading file:', where);

  lineReader.eachLine(where, function(line) {
    if (program.verbose) console.log('Processing', line);

    var matches = line.match(REGEX);

    if (!matches || matches.length < 4) {
      console.log('Could not process', line);
      process.exit(1);
    }

    var parts = matches[1].split(' ');

    if (parts.length == 2) {
      insertPlayer({
        firstname: parts[0],
        lastname: parts[1],
        team: matches[2],
        position: matches[3]
      });
    } else {
      console.warn('Skipping ambigious name', matches[1]);
    }
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
.option('-v, --verbose', 'Verbose output', false);

program
.command('load [filename]')
.description('Load a player list into the database')
.action(exec);

program.parse(process.argv);

