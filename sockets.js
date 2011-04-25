var io = require('socket.io'),
    express = require('express'),
    RedisStore = require('connect-redis'),
    redis = require('redis'),
    Ni = require('ni'),
    socket = null,
    sessionStore,
    redisListener = redis.createClient(Ni.config('redis_port'), 
                                  Ni.config('redis_host')),
    redisPublisher = redis.createClient(Ni.config('redis_port'), 
                                  Ni.config('redis_host')),
    Emitter = require('events').EventEmitter,
    listener = new Emitter(),
    socketCounter = 0;
    
redisListener.select(Ni.config('redis_pubsub_db'));
redisPublisher.select(Ni.config('redis_pubsub_db'));

redisListener.on("message", function (channel, message) {
  listener.emit(channel, message);
});

var listenerCount = {},
listenerMaxSet = false;

listener.on('newListener', function (event) {
  if ( ! listenerMaxSet) { // this is a workaround for a bug in node where you cannot set the max when no listeners have been assigned yet. (was fixed in master, but so long this will do)
    listener.setMaxListeners(100);
  }
  if ( ! listenerCount.hasOwnProperty(event)) {
    listenerCount[event] = 0;
  }
  listenerCount[event]++;
  redisListener.subscribe(event);
});

/** TODO: THERE IS A GIANT MEMORY LEAK HERE!
 * The problem is that we just keep defining listeners and they never get removed :(
 * possible solution: put the listener into the client and unsubscribe redis if something is published and no listeners are left. (still leaking, but way less)
 * possible solution for 2: use the listenerCount to know if redis has to unsubscribe.
 */

var sessionHandler = function (client) {
  express.cookieParser()(client.request, null, function () {
    var sessionId = client.request.cookies[Ni.config('cookie_key')];
    
    sessionStore.get(sessionId,
      function (err, session) {
        if (err) {
          console.dir(err);
        } else {
          client.appSession = session;
          client.appSessionId = sessionId;
          
          if ( ! session.logged_in) {
            client.name = 'Guest '+ (++socketCounter);
          } else {
            client.name = session.user.name;
          }
          
          client.send({
            type: 'set_meta',
            message: {
              name: 'selfName',
              value: client.name
            }
          });
          
          listener.on('pubsub.sess.'+sessionId, function (newId) {
            client.send({
              type: 'set_cookie',
              message: {
                name: Ni.config('cookie_key'),
                value: newId,
                options: Ni.config('cookie_config'),
                overwrite: 'different'
              }
            });
          });
        }
      });
  });
};

var messageHandler = {
  subscribe: function (msg) {
    var self = this;
    if (this.subscriptions > 100) {
      this.send({
        type: 'error',
        message: {
          value: 'Too many subscriptions'
        }
      });
      return false;
    }
    if ( ! msg.channel || msg.channel.indexOf('pubsub.public') !== 0) {
      // todo validation
      return false;
    }
    
    this.subscriptions++;
    listener.on(msg.channel, function (newMsg) {
      console.log('sending '+newMsg+' from '+msg.channel);
      self.send({
        type: 'published',
        message: {
          channel: msg.channel,
          value: JSON.parse(newMsg)
        }
      });
    });
  },
  publish: function (msg) {
    if (msg.channel.indexOf('pubsub.public') !== 0) {
      // todo validation
      return false;
    }
    
    console.log('publishing '+msg.value+' to '+msg.channel);
    var obj = {
      value: msg.value,
      publisher: this.name
    };
    redisPublisher.publish(msg.channel, JSON.stringify(obj));
  }
};

exports.listen = function (app) {
  socket = io.listen(app);
  socket.on('connection', function(client) {
    sessionHandler(client);
    client.subscriptions = 0;
    
    client.on('message', function (msg) {
      if (msg.type && messageHandler[msg.type]) {
        messageHandler[msg.type].call(client, msg.message);
      }
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