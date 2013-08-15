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
    $('#footer').hide();

    _.bindAll(this, 'connected', 'pickMade', 'ready', 'error',
             'populateConfirm', 'confirmPick', 'select', 'startDraft');

    this.connect();
    this.setupNavbar();
    this.setupConfirm();
  },

  /**
   *
   */
  connect: function() {
    this._socket = io.connect();

    this.showLoading('Connecting...');

    this._socket.on('connect', this.connected);
    this._socket.on('draft:pickMade', this.pickMade);
    this._socket.on('draft:error', this.error);
  },

  /**
   *
   */
  error: function(data) {
    console.error('Received server error', data);
  },

  /**
   *
   */
  connected: function() {
    console.log('Connected');
    this._socket.emit('picker:ready', this.ready);
  },

  /**
   *
   */
  ready: function(data) {
    if (data.error) {
      return console.error(data.error);
    }

    console.log('Ready');

    this.hideLoading();
    $.mobile.changePage('#pick', { changeHash: false });

    if (data.started) {
      this.showList('QB');
    } else {
      $('#startDraft').click(this.startDraft);
      $('#notstarted').popup('open');
    }
  },

  /**
   *
   */
  pickMade: function(data) {
    var player = data.player;
    this.hideLoading();
  },

  /**
   *
   */
  setupNavbar: function() {
    $('nav a').click(function() {
      picker.showList($(this).text());
    });

    $('#makePick').click(this.populateConfirm);
  },

  /**
   *
   */
  setupConfirm: function() {
    $('#makePick').click(this.populateConfirm);
    $('#confirmPick').click(this.confirmPick);
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
  confirmPick: function() {
    var player = $(this._selected).data('player');
    console.log('Confirming pick', player);
    this._socket.emit('picker:pick', player, function(data) {
      if (data.error) {
        console.error(data.error);
      }
    });
    this.showLoading('Making pick...');
  },

  /**
   *
   */
  startDraft: function() {
    console.log('Starting draft');
    this._socket.emit('picker:startDraft', function(data) {
      if (data.error) {
        console.error(data.error);
      }
    });
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
      li.append(a).appendTo(elem).click(self.select);
      li.data('player', player);
    });

    elem.listview('refresh');
  },

  showLoading: function(msg) {
    $('body').addClass('ui-disabled');
    $.mobile.loading('show', { text: msg, textVisible: true });
  },

  hideLoading: function() {
    $('body').removeClass('ui-disabled');
    $.mobile.loading('hide');
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

  /**
   *
   */
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
