"use strict";

var express = require('express'),
conductor = require('conductor'),
nohm = require('nohm'),
fs = require('fs'),
RedisStore = require('connect-redis'),
Ni = require('ni');

fs.writeFileSync('/tmp/etourney.pid', process.pid.toString());


//node-daemon hack
var controllers = fs.readdirSync('controllers'),
models = fs.readdirSync('models'),
node_daemon_reload_hack = function () {
  require('child_process').spawn('touch', ['app.js']);
};
for (var i = 0, len = models.length; i < len; i = i + 1) {
  if (models[i].match(/Model\.js$/i)) {
    fs.watchFile('./models/' + models[i], node_daemon_reload_hack);
  }
}
for (var i = 0, len = controllers.length; i < len; i = i + 1) {
  if (controllers[i].match(/\.js$/i)) {
    fs.watchFile('./controllers/' + controllers[i], node_daemon_reload_hack);
  }
}


// real application starts now!

Ni.setRoot(__dirname);

Ni.boot(function() {
  
  Ni.controllers.home = Ni.controllers.News;
  
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
  
  app.use(function (req, res, next) {
    res.original_render = res.render;
    res.rlocals = {};
    res.render = function (file, options) {
      res.rlocals.session = req.session;
      if (typeof(options) === 'undefined') {
        options = {};
      }
      options.locals = res.rlocals;
      res.original_render(file, options);
    };
    next();
  });
  
  app.use(Ni.router);
  
  app.use(function (req, res, next) {
    res.send('404 - Not found.');
  });
  
  if (app.set('env') !== 'production') {
    app.use(express.errorHandler({ showStack: true }));
  }

  app.listen(3000);
  console.log('listening on 3000');
});