/*jshint browser:true */
/*global io, $, _ */

var board = {

  // The socket.io connection
  _socket: null,

  /**
   *
   */
  init: function() {
    _.bindAll(this, 'connected', 'error', 'pickMade', 'nowPicking');

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
    this._socket.emit('board:ready');
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
  },

  /**
   *
   */
  nowPicking: function(data) {
    console.log('nowPicking', data);
  }

};

$(document).ready(_.bind(board.init, board));
