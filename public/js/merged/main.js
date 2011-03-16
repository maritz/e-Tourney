_r(function () {
  window.app = new PageController();
}, true);

_r(function () {
  Backbone.history.start();
  
  $('#reload_page').live('click', function () {
    window.app.reload();
  });
  
  $('#header_userbox input[type="button"]').click(function () {
    window.location = '#User/register';
  });
  
  window.socket = new io.Socket();
  socket.connect();
  socket.on('connect', function(){
    console.log('connected');
  });
  socket.on('message', function(msg){
    if (typeof(msg) === 'string') {
      $.jGrowl(msg);
    } else {
      console.dir(msg);
      if (msg.type === 'set_cookie') {
        var options = msg.message.options;
        if (options.maxAge && ! options.expires) {
          options.expires = new Date(Date.now() + options.maxAge);
        }
        $.cookie(msg.message.name, msg.message.value, options);
      }
    }
  });
  socket.on('disconnect', function(){
    console.log('disconnect');
  })
});