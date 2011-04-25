_r(function () {
  window.app.models.chat = window.app.models.base.extend({
    initialize: function (options) {
      var self = this;
      this.users = new Chatters();
      this.messages = new Messages();
      
      socket.subscribe('chat.main', function (msg) {
        self.messages.add({
          nick: msg.publisher,
          text: msg.value,
          time: +new Date()
        });
      });
    }
  });
  
  var Chatter = Backbone.Model.extend({});
  var Chatters = Backbone.Collection.extend({
    model: Chatter
  });
  
  var Message = Backbone.Model.extend({});
  var Messages = Backbone.Collection.extend({
    model: Message
  });

});
