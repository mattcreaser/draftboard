/*jshint browser:true */
/*global io, $, _, PickTimer */

var board = {

  // The socket.io connection
  _socket: null,

  // The pickTimer.
  _timer: null,

  /**
   *
   */
  init: function() {
    _.bindAll(this, 'connected', 'error', 'pickMade', 'nowPicking', 'ready');

    this.connect();
  },

  /**
   *
   */
  connect: function() {
    this._socket = io.connect();

    this._socket.on('connect', this.connected);
    this._socket.on('draft:error', this.error);
    this._socket.on('board:error', this.error);

    this._socket.on('draft:pickMade', this.pickMade);
    this._socket.on('draft:nowPicking', this.nowPicking);
  },

  /**
   *
   */
  connected: function() {
    console.log('Connected');
    this._socket.emit('board:ready', this.ready);
  },

  /**
   *
   */
  ready: function(data) {
    if (data.error) {
      return console.error(data.error);
    }

    console.log('Ready');
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
  pickMade: function(data) {
    console.log('pickMade', data);

    var row = $('#draftboard tbody tr:eq(' + (data.round) + ')');
    var cell = row.find('td:eq(' + (data.slot) + ')');

    var tmpl = $('#pickTemplate').html();
    var content = _.template(tmpl, data.player);

    cell.html(content);
  },

  /**
   *
   */
  nowPicking: function(data) {
    console.log('nowPicking', data);
    $('.current-drafter').removeClass('current-drafter');
    $('#draftboard thead th:eq(' + data.slot + ')').addClass('current-drafter');

    if (this._timer) {
      this._timer.stop();
    }

    this._timer = new PickTimer();
    this._timer.elapsedTime = data.elapsedTime;

    var row = $('#draftboard tbody tr:eq(' + (data.round) + ')');
    var cell = row.find('td:eq(' + (data.slot) + ')');

    cell.append(this._timer.el);
  }

};

$(document).ready(_.bind(board.init, board));
