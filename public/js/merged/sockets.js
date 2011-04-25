window.socket = new io.Socket();
socket.connect();
_r(function () {
  
  window.socketHandlers = {
    set_cookie: function (msg) {
      var options = msg.options,
          oldCookie = $(msg.message.name);
      if (options.overwrite === 'different' && oldCookie && oldCookie === msg.value ) {
        return null;
      }
      if (options.overwrite === 'none'&& oldCookie) {
        return null;
      }
      if (options.maxAge && ! options.expires) {
        options.expires = new Date(Date.now() + options.maxAge);
      }
      $.cookie(msg.name, msg.value, options);
    },
    set_meta: function (msg) {
      window.registry[msg.name] = msg.value;
    },
    published: function (msg) {
      socket.emit('published_'+msg.channel, [msg.value, msg.channel]);
    }
  };
  
  socket.on('connect', function(){
    console.log('websocket connected');
  });
  socket.on('message', function(msg){
    if (typeof(msg) === 'string') {
      $.jGrowl(msg);
    } else if (typeof(socketHandlers[msg.type]) !== 'undefined') {
        socketHandlers[msg.type](msg.message);
    }else {
      console.log('received invalid socket message:');
      console.dir(msg.message);
    }
  });
  socket.on('disconnect', function(){
    console.log('websocket disconnect');
  });
  
  socket.subscribe = function (channel, cb) {
    channel = 'pubsub.public.'+channel;
    socket.send({
      type: 'subscribe', 
      message: {
        channel: channel
      }
    });
    socket.on('published_'+channel, function (arr) {
      cb.apply(null, arguments);
    });
  };
  
  socket.publish = function (channel, value) {
    socket.send({
      type: 'publish', 
      message: {
        channel:'pubsub.public.'+channel, 
        value: value
      }
    });
  };
  
});