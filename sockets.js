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
    redisListenerCounter = {};
    
redisPublisher.select(Ni.config('redis_pubsub_db'));
redisListener.select(Ni.config('redis_pubsub_db'));

var guestCounter = 0;

var sessionHandler = function (client) {
  
  var setNewSession = function (session) {
    client.appSession = session;
    
    if ( ! session.logged_in) {
      client.name = 'Guest '+ (++guestCounter);
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
  };
  
  express.cookieParser()(client.request, null, function () {
    var sessionId = client.request.cookies[Ni.config('cookie_key')];
    
    sessionStore.get(sessionId, function (err, session) {
      if (err) {
        console.dir(err);
      } else {
        setNewSession(session);
        
        // on session changes
        client.redis.on('pubsub.sess.'+sessionId, function (newId) {
          // set the new sid cookie
          client.send({
            type: 'set_cookie',
            message: {
              name: Ni.config('cookie_key'),
              value: newId,
              options: Ni.config('cookie_config'),
              overwrite: 'different'
            }
          });
          
          // get the new user name
          sessionStore.get(newId, function (err, session) {
            setNewSession(session);
          });
        });
      }
    });
  });
};


var messageHandler = {
  
  /**
   * Subscribes to the redis pubsub system.
   * Only channels that start with pubsub.public are allowed
   */
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
      return false;
    }
    
    this.subscriptions++;
    this.redis.on(msg.channel, function (newMsg) {
      console.log('sending '+newMsg+' from '+msg.channel+' to '+self.name);
      self.send({
        type: 'published',
        message: {
          channel: msg.channel,
          value: JSON.parse(newMsg)
        }
      });
    });
  },
  
  
  /**
   * Publishes to the redis pubsub system.
   * Only channels that start with pubsub.public are allowed
   */
  publish: function (msg) {
    if (msg.channel.indexOf('pubsub.public') !== 0) {
      return false;
    }
    
    var obj = {
      value: msg.value,
      publisher: this.name
    };
    console.log('publishing '+JSON.stringify(obj)+' to '+msg.channel);
    redisPublisher.publish(msg.channel, JSON.stringify(obj));
  }
};

/**
 * Create the socket server
 */
exports.listen = function (app) {
  socket = io.listen(app);
  socket.on('connection', function(client) {
    client.subscriptions = 0;
    
    client.redis = new Emitter();
    var clientRedisEvents = [];
    redisListener.on('message', function (channel, message) {
      console.log('client redis emitting on channel: '+channel+' to '+client.name);
      client.redis.emit(channel, message);
    });
    
    client.redis.on('newListener', function (event, listener) {
      console.log('listening to '+event);
      if ( ! redisListenerCounter.hasOwnProperty(event)) {
        redisListenerCounter[event] = 0;
        clientRedisEvents.push(event);
        console.dir('subscribing redis to '+event);
        redisListener.subscribe(event);
      }
      redisListenerCounter[event]++;
    });
    
    sessionHandler(client);
    
    client.on('message', function (msg) {
      if (msg.type && messageHandler[msg.type]) {
        messageHandler[msg.type].call(client, msg.message);
      }
    });
    
    client.on('disconnect', function () {
      clientRedisEvents.forEach(function (event) {
        console.log('unsubscribing client redis from '+event);
        client.redis.removeAllListeners(event);
        redisListenerCounter[event]--;
        if (redisListenerCounter[event] <= 0) {
          console.log('unsubscribing redis from '+event);
          redisListener.unsubscribe(event);
          delete redisListenerCounter[event];
        }
      });
    });
  });
};

exports.getSocket = function () {
  return socket;
};

/**
 * Create a proxy function to replace the sid regenerator of the redis session store to publish any sid changes.
 */
exports.proxyRedisStore = function () {  
  var regen = RedisStore.prototype.regenerate;
  RedisStore.prototype.regenerate = function (req, fn) {
    var oldID = req.sessionID;
    regen.call(this, req, function (err) {
      if (err) {
        console.log('An error occured while regenerating the session: (maybe sockets.js proxyRedisStore() is responsible)');
        console.dir(err);
        return fn(err);
      }
      redisPublisher.publish('pubsub.sess.'+oldID, req.sessionID);
      fn();
    });
  };
};

/**
 * Make the redis session store available for the proxy function above
 */
exports.setSessionStore = function (store) {
  sessionStore = store;
};