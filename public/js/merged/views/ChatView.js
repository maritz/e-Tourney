_r(function () {
  window.app.views.chat = {};
  window.app.views.chat.index = Backbone.View.extend({
    
    initialize: function ($context) {
      this.el = $context.children('div.chat.main');
      this.model = new app.models.chat();
      this.model.view = this;
      
      _.bindAll(this, 'sendMessage', 'addMessage', 'addUser', 'removeUser');
      
      this.model.messages.bind('add', this.addMessage);
      
      window.testModel = this.model;
      
      this.msgs = this.$('.messages tbody');
      
      this.chatChannel = 'chat.main';
      
      this.$('form').bind('submit', this.sendMessage);
    },
    
    sendMessage: function (e) {
      e.preventDefault();
      var input = this.$('input[type="text"]');
      socket.publish(this.chatChannel, input.val());
      input.val(null);
    },
    
    addMessage: function (message) {
      var self = this;
      app.template('chat', 'message', message.attributes, function (html) {
        console.dir(self.msgs);
        self.msgs.append(html);
      });
    }
  });

});
