#!/usr/bin/env node

var players =
  ["Matt", "Jon", "David B", "Tyler", "Shawn", "Gary",
   "Brad", "Lincoln", "Andrew", "Paul", "Thomas", "David A"];

function rotatePlayers(backward) {
  var row1 = players.slice(1, 6);
  var row2 = players.slice(6);

  if (backward) {
    row2.unshift(row1.shift());
    row1.push(row2.pop());
  } else {
    row1.unshift(row2.shift());
    row2.push(row1.pop());
  }

  players = [players[0]].concat(row1).concat(row2);
}

function printMatchups(week) {
  console.log('== Week ', week, '==');
  for (var i = 0; i < 6; ++i) {
    console.log('\t', players[i], '<>', players[i + 6]);
  }
}

for (var i = 9; i <= 13; ++i) {
  printMatchups(i);
  rotatePlayers();
}

while (--i > 0) {
  rotatePlayers(true);
  if (i < 9) {
    printMatchups(i);
  }
}
