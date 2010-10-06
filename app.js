"use strict";

var express = require('express'),
conductor = require('conductor'),
jade = require('jade'),
nohm = require('nohm'),
fs = require('fs'),
RedisStore = require('connect-redis');

// initialize the main app
var app = express.createServer();
app.set('view engine', 'jade');

if (app.set('env') !== 'production') {
  app.use(express.lint(app));
}

// static stuff
app.use(express.favicon(__dirname + '/public/images/icons/favicon.png'));
app.use(express.staticProvider(__dirname + '/public'));

// start main app pre-routing stuff
app.use(express.bodyDecoder());
app.use(express.cookieDecoder());
app.use(express.session({ store: new RedisStore({ magAge: 60000 * 60 * 24 }) })); // one day

app.dynamicHelpers({
  input: {
    date_parser: function (timestamp) {
      function pad (n) {
        return n < 10 ? '0' + n : n;
      }
      var date = new Date(timestamp);
      return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate());
    }
  }
});

var checkLogin = function (do_redirect) {
  return false;
};

app.use('', function (req, res, next) {
  req.checkLogin = checkLogin;
  next();
});

var controllers = fs.readdirSync('controllers'),
controllerGlobals = {
  Models: {},
  redis: nohm.redis.createClient()
},
models = fs.readdirSync('models'),
node_daemon_reload_hack = function () {
  require('child_process').spawn('touch', ['app.js']);
};
for (var i = 0, len = models.length; i < len; i = i + 1) {
  if (models[i].match(/Model\.js$/i)) {
    var name = models[i].replace(/Model\.js$/i, '');
    controllerGlobals.Models[name] = require('./models/' + name + 'Model');
    // node-daemon hack follows
    fs.watchFile('./models/' + name + 'Model.js', node_daemon_reload_hack);
  }
}
for (var i = 0, len = controllers.length; i < len; i = i + 1) {
  if (controllers[i].match(/\.js$/i)) {
    var name = controllers[i].replace(/\.js$/i, '');
    app.use('/' + name, require('./controllers/' + name).init(controllerGlobals));
    // node-daemon hack follows
    fs.watchFile('./controllers/' + name + '.js', node_daemon_reload_hack);
  }
}

var index = function (req, res, next) {
  res.render('index', {
    locals: res.render_locals
  });
};

app.get('/', index);

app.get('*', function (req, res, next) {
  res.send('<html><head><title>404 - Not found.</title></head><body>Not found.</body></html>');
});

app.post('*', function (req, res, next) {
  res.send('<html><head><title>404 - Not found.</title></head><body>Not found.</body></html>');
});

app.use(express.errorHandler({ showStack: true }));


app.listen(3000);
console.log('listening on 3000');