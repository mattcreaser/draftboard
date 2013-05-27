/*global Backbone, _, $ */

var PickTimer = Backbone.View.extend({

  // The amount of time that this timer has been running, in milliseconds. Time
  // is not counted while the timer is stopped.
  elapsedTime: 0,

  // The timestamp of the most recent update. Used to determine how much time
  // has passed. This is used instead of just counting the intervals to ensure
  // the timer is accurate. This value is in milliseconds.
  previousTime: 0,

  // The id of the interval used to update the elapsed time. Falsey if the
  // interval is not running.
  interval: 0,

  /**
   *
   */
  initialize: function() {
    _.bindAll(this, 'updateElapsedTime');

    this.start();
    this.render();
  },

  /**
   * Starts the timer if it's not already running. If it is running, this
   * function does nothing.
   */
  start: function() {
    // Do nothing if already started.
    if (this.interval) return;

    // Initialize the previous time.
    this.previousTime = +(new Date());

    // Start an interval to update the time. The interval is run more frequently
    // than the clock is updated so as to ensure the visual updates happen
    // without much delay.
    this.interval = window.setInterval(this.updateElapsedTime, 200);
  },

  /**
   * Stops the timer if it's running. If it is not running, this function does
   * nothing.
   */
  stop: function() {
    window.clearInterval(this.interval);
    this.interval = 0;
  },

  /**
   *
   */
  render: function() {
    var totalSeconds = Math.floor(this.elapsedTime / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    var displayedTime = _.str.sprintf('%02d:%02d', minutes, seconds);

    var extraClass = '';
    if (totalSeconds > 5 * 60) extraClass = 'timerOverdue';
    else if (totalSeconds > 2 * 60) extraClass = 'timerLong';

    var vars = {
      displayedTime: displayedTime,
      extraClass: extraClass
    };

    var template = _.template($('#pickTimerTemplate').html(), vars);
    this.$el.html(template);
  },

  /**
   *
   */
  updateElapsedTime: function() {
    var now = +(new Date());
    this.elapsedTime += now - this.previousTime;
    this.previousTime = now;
    this.render();
  }

});
