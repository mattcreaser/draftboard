/*jshint browser:true */
/*global $, io, _, players */

var picker = {

  // The socket.io connection.
  _socket: null,

  // The selected li element.
  _selected: null,

  /**
   *
   */
  init: function() {
    this.connect();
    this.setupNavbar();
    $('#footer').hide();
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
    this.showList('QB');
  },

  /**
   *
   */
  setupNavbar: function() {
    $('nav a').click(function() {
      picker.showList($(this).text());
    });

    var self = this;
    $('#makePick').click(function(e) {
      self.populateConfirm();
    });
  },

  /**
   *
   */
  populateConfirm: function() {
    var player = $(this._selected).data('player');
    var tmpl = $('#pickConfirmTemplate').html();
    var content = _.template(tmpl, { player: player });
    $('#playerConfirm').html(content);
  },

  /**
   *
   */
  showList: function(page) {
    var list = players[page] || [];
    if (page === 'K/DEF') {
      list = players.K.concat(players.DEF);
    }

    var elem = $('#playerlist');

    elem.empty();
    this.clearSelection();

    var self = this;
    _.each(list, function(player) {
      var a = $('<a/>').attr('href', '#')
        .text(player.firstname + ' ' + player.lastname + ', ' + player.team);
      var li = $('<li/>');
      li.append(a).appendTo(elem).click(_.bind(self.select, self));
      li.data('player', player);
    });

    elem.listview('refresh');
  },

  /**
   *
   */
  select: function(e) {
    if (this._selected === e.currentTarget) {
      return this.clearSelection();
    }

    if (this._selected) {
      $(this._selected).attr("data-theme", "c").removeClass("ui-btn-up-b")
                       .removeClass('ui-btn-hover-b').addClass("ui-btn-up-c")
                       .addClass('ui-btn-hover-c');
    }

    $(e.currentTarget).attr("data-theme", "b").removeClass("ui-btn-up-c")
                      .removeClass('ui-btn-hover-c').addClass("ui-btn-up-b")
                      .addClass('ui-btn-hover-b');

    this._selected = e.currentTarget;

    $('#footer').show();
  },

  clearSelection: function() {
    if (!this._selected) {
      return;
    }

    $(this._selected).attr("data-theme", "c").removeClass("ui-btn-up-b")
                     .removeClass('ui-btn-hover-b').addClass("ui-btn-up-c")
                     .addClass('ui-btn-hover-c');

    this._selected = null;

    $('#footer').hide();
  }
};

/**
 *
 */
$(document).ready(_.bind(picker.init, picker));
