var io = require('socket.io'),
    express = require('express'),
    RedisStore = require('connect-redis'),
    redis = require('redis'),
    Ni = require('ni'),
    socket = null,
    sessionStore,
    redisListener = redis.createClient(Ni.config('redis_port'), 
                                  Ni.config('redis_host'))
    Emitter = require('events').EventEmitter,
    listener = new Emitter();
    
redisListener.select(Ni.config('redis_pubsub_db'));

redisListener.on("message", function (channel, message) {
  listener.emit(channel, message);
});

var subscribe = function (channel, fn) {
  listener.on(channel, function () {
    console.dir(arguments);
    fn();
  });
  console.log('subscribed to '+channel);
  redisListener.subscribe(channel);
}

var sessionHandler = function (client) {
  express.cookieParser()(client.request, null, function () {
    var sessionId = client.request.cookies[Ni.config('cookie_key')];
    sessionStore.get(sessionId,
      function (err, session) {
        if (err) {
          console.dir(err);
        } else {
          client.session = session;
          client.sessionId = sessionId;
          var channel = 'pubsub.sess.'+sessionId;
          subscribe(channel, function () {
            client.send({
              type: 'session_regenerated',
              message: 'blub'
            });
          });
        }
      });
  });
}

exports.listen = function (app) {
  socket = io.listen(app);
  socket.on('connection', function(client) {
    sessionHandler(client);
    
    client.on('message', function (msg) {
      client.broadcast(msg);
      client.send('You just send:'+msg);
    });
  });
};

exports.getSocket = function () {
  return socket;
};
    
exports.proxyRedisStore = function () {
  var set = RedisStore.prototype.set;
  RedisStore.prototype.set = function (sid, sess, fn) {
    set.apply(this, arguments);
  };
  
  var regen = RedisStore.prototype.regenerate;
  RedisStore.prototype.regenerate = function (req, fn) {
    var self = this,
        oldID = req.sessionID;
    regen.call(this, req, function (err) {
      if (err) {
        console.log('An error occured while regenerating the session: (maybe sockets.js proxyRedisStore() is responsible)');
        console.dir(err);
        return fn(err);
      }
      self.client.publish('pubsub.sess.'+oldID, req.sessionID, fn);
    });
  };
};
    
exports.setSessionStore = function (store) {
  sessionStore = store;
};