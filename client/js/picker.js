/*jshint browser:true */
/*global $, io, _, players */

var picker = {

  // The socket.io connection.
  _socket: null,

  // The selected li element.
  _selected: null,

  // The info about the drafter. Populated on the ready response.
  _info: null,

  _players: null,

  _currentPage: 'QB',

  /**
   *
   */
  init: function() {
    $('#footer').hide();

    _.bindAll(this, 'connected', 'pickMade', 'ready', 'error',
             'populateConfirm', 'confirmPick', 'select', 'startDraft',
             'nowPicking', 'remainingPlayers', 'createPlayer', 'draftOver');

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
    this._socket.on('draft:nowPicking', this.nowPicking);
    this._socket.on('draft:remainingPlayers', this.remainingPlayers);
    this._socket.on('draft:over', this.draftOver);
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

    this._info = data.info;

    console.log('Ready');

    this.hideLoading();

    if (this._info.isAdmin) {
      $('#startBlock').show();
      $('#startDraft').click(this.startDraft);
      this.setupCreatePlayer();
    }
  },

  /**
   *
   */
  remainingPlayers: function(data) {
    console.log('Got list of remaining players:', data);
    this._players = _.groupBy(data.players, 'position');
  },

  /**
   *
   */
  pickMade: function(data) {
    var player = data.player;
    this.hideLoading();

    console.log('Removing picked player', player);
    var current = this._players[player.position];
    this._players[player.position] = _.reject(current, player);
  },

  /**
   *
   */
  draftOver: function(data) {
    this.hideLoading();
    $.mobile.changePage('#over');
    this._socket.disconnect();
  },

  /**
   *
   */
  nowPicking: function(data) {
    this.hideLoading();

    if (data.slot === this._info.slot || this._info.isAdmin) {
      $.mobile.changePage('#pick', { changeHash: false });
      this.showList(this._currentPage);
    } else {
      var snaking = (data.round % 2 === 1);
      var remaining = (snaking) ? data.slot - this._info.slot :
                                  this._info.slot - data.slot;

      if (remaining < 0) {
        var toTurn = snaking ? this._info.slot : 11 - this._info.slot;
        remaining = toTurn * 2 + remaining + 1;
      }

      var tmpl = $('#waitingTemplate').html();
      var html = _.template(tmpl, {
        name: data.drafter.name,
        remaining: remaining
      });

      $('#waiting').html(html);
      $.mobile.changePage('#waiting', { changeHash: false });
    }
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
  setupCreatePlayer: function() {
    var self = this;

    $(document).on('swipeleft', '#pick', function(e) {
      if ($.mobile.activePage.jqmData('panel') !== 'open') {
        $('#createPlayer').panel('open');
      }
    });

    $('#createSubmit').click(this.createPlayer);
  },

  /**
   *
   */
  createPlayer: function() {
    var player = {
      firstname: $('#createFirstname').val(),
      lastname: $('#createLastname').val(),
      position: $('#createPosition').val(),
      team: $('#createTeam').val()
    };

    console.log('Creating player', player);

    var self = this;
    this._socket.emit('picker:createPlayer', player, function(data) {
      if (data.error) {
        return console.error('Could not create player', data.error);
      }

      self._players[player.position].push(data.player);
      $('#createPlayer').panel('close');
      self.showList(self._currentPage);
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
  confirmPick: function() {
    var player = $(this._selected).data('player');
    console.log('Confirming pick', player);
    this._socket.emit('picker:pick', player, function(data) {
      if (data.error) {
        console.error(data.error);
      }
      $('input[data-type="search"]').val("");
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
    var list = this._players[page] || [];
    if (page === 'K/DEF') {
      list = this._players.K.concat(this._players.DEF);
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
    this._currentPage = page;
  },

  /**
   *
   */
  showLoading: function(msg) {
    $('body').addClass('ui-disabled');
    $.mobile.loading('show', { text: msg, textVisible: true });
  },

  /**
   *
   */
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
