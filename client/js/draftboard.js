/*global Backbone, PickTimer */

var Draftboard = Backbone.View.extend({

  initialize: function() {
    var clock = new PickTimer();
    $(document.body).append(clock.el);
  },

});

$(function() {
  var draftboard = new Draftboard();
});
