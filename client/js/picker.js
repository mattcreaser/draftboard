/*jshint browser:true */
/*global $, io, _ */

var players = {
  QB: [
    { name: 'T. Brady', team: 'New England Patriots' },
    { name: 'P. Manning', team: 'Denver Broncos' }
  ],
  RB: [
    { name: 'A. Peterson', team: 'Minnesota Vikings' },
    { name: 'S. Ridley', team: 'New England Patriots' }
  ],
  WR: [
    { name: 'D. Amendola', team: 'New England Patriots' },
    { name: 'C. Johnson', team: 'Detroit Lions' }
  ],
  TE: [
    { name: 'R. Gronkowski', team: 'New England Patriots' },
    { name: 'V. Davis', team: 'San Francisco 49ers' }
  ],
  K: [
    { name: 'S. Gostkowski', team: 'New England Patriots' },
    { name: 'S. Janikowski', team: 'Oakland Raiders' }
  ],
  DEF: [
    { name: 'DEF', team: 'New England Patriots' },
    { name: 'DEF', team: 'Green Bay Packers' }
  ]
};

var picker = {

  _socket: null,

  /**
   *
   */
  init: function() {
    this.connect();
    this.setupNavbar();
  },

  /**
   *
   */
  connect: function() {
    this._socket = io.connect();

    $.mobile.loading('show', {
      text: 'Connecting...',
      textVisible: true
    });

    this._socket.on('connect', _.bind(this.connected, this));
  },

  /**
   *
   */
  connected: function() {
    $.mobile.loading('hide');
    $.mobile.changePage('#pick', { changeHash: false });
    this.showList('ALL');
  },

  setupNavbar: function() {
    $('nav a').click(function() {
      picker.showList($(this).text());
    });
  },

  showList: function(page) {
    var list = players[page] || [];
    if (page === 'ALL') {
      _.each(players, function(l) { list = list.concat(l); });
    }

    var elem = $('#playerlist');

    elem.empty();

    _.each(list, function(player) {
      var a = $('<a/>').attr('href', '#').text(player.name + ', ' + player.team);
      $('<li/>').append(a).appendTo(elem);
    });

    elem.listview('refresh');
  }
};

/**
 *
 */
$(document).ready(_.bind(picker.init, picker));
