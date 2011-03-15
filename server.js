var express = require('express'),
RedisStore = require('connect-redis'),
Ni = require('ni'),
fugue = require('fugue'),
helpers = require(__dirname + '/helpers/general'),
assetManager = require('connect-assetmanager'),
assetHandlers = require('connect-assetmanager-handlers'),
i18n = require(__dirname + '/helpers/translations.js'),
vsprintf = require('sprintf').vsprintf,
nohm = require('nohm'),
viewHelpers = require(__dirname + '/helpers/view'),
io = require('socket.io');

var start = exports.start = function () {
  Ni.boot(function() {
    nohm.connect(Ni.config('redis_port'), Ni.config('redis_host'));
		var nohmclient = nohm.getClient();
		nohmclient.select(Ni.config('redis_nohm_db'), function (err) {
		  if (err) {
		    console.dir(err);
		  }
		  Ni.config('nohmclient', nohmclient);
		});
		
		var workerstart = new Date().toLocaleTimeString();
		
		Ni.addRoute('/', '/News/index');
		Ni.addRoute(/^\/register/i, '/User/register');
		Ni.addRoute(/^\/logout/i, '/User/logout');
		Ni.addRoute(/^\/login/i, '/User/login');
		
		// initialize the main app
		var app = express.createServer();
		app.set('view engine', 'jade');
		
		if (app.set('env') !== 'production') {
		  app.use(express.lint(app));
		} else {
		  app.use(express.logger());
		}
		
		// static stuff
		app.use(express.conditionalGet());
		app.use(express.favicon(__dirname + '/public/images/icons/favicon.png'));
		
    //app.use(express.gzip());
		
		// connect assetmanager to pack js. (css already handled by sass)
		var files = require(__dirname + '/helpers/collect-client-js');
		var assetsManagerMiddleware = assetManager({
		    'js': {
		        'route': /\/js\/[0-9]+\/merged\.js/
		        , 'path': __dirname + '/public/js/merged/'
		        , 'dataType': 'javascript'
		        , 'files': files
		        , 'preManipulate': {
		            'MSIE': []
		            , '^': app.set('env') === 'production' ? [
		                assetHandlers.uglifyJsOptimize
		            ] : [] // only minify if in production mode
		        }
		        , 'debug': app.set('env') !== 'production' // minification only in production mode
		    }
		});
		app.use(assetsManagerMiddleware);
		
		
		app.use(express.staticProvider(__dirname + '/public'));
		
		// start main app pre-routing stuff
		
		app.use(express.bodyDecoder());
		app.use(express.cookieDecoder());
		
		var redisSessionStore = new RedisStore({magAge: 60000 * 60 * 24 /* one day */, port: Ni.config('redis_port')});
		redisSessionStore.client.select(Ni.config('redis_session_db'), function () {
		  
		  app.use(express.session({key: Ni.config('cookie_key'),
		    secret: Ni.config('cookie_secret'),
		    store: redisSessionStore}));
		  
		  // some session stuff
		  app.use(function (req, res, next) {		    
		    if (typeof(req.session.lang) === 'undefined') {
		      req.session.lang = 'en_US';
		    }
		    next();
		  });
		  
		  // set language stuff
		  app.get('*', function (req, res, next) {
		    var lang = req.param('lang');
		    if (typeof(lang) !== 'undefined' && i18n.langs.indexOf(lang) >= 0) {
		      req.session.lang = req.param('lang');
		    }
		    next();
		  });
		  
		  app.use(function (req, res, next) {
		    lang = req.session.lang;
		    req.tr = function tr (key) { // TODO: maybe cache this on a per-language base
		      var args = Array.prototype.slice.call(arguments);
		      args.shift();
		      var str = i18n.getTranslation(lang, key);
		      return vsprintf(str, args);
		    }
		    next();
		  })
		
		  // render stuff
		  app.use(function (req, res, next) {
		    res.original_render = res.render;
		    res.rlocals = {};
		    res.render = function (file, options) {
		      var rlocals = res.rlocals;
		      rlocals.tr = req.tr;
		      rlocals.loggedClass = req.session.logged_in ? 'logged_in' : '';
		      rlocals.currentUrl = req.url;
		      rlocals.workerId = fugue.workerId();
		      rlocals.workerStart = workerstart;
		      rlocals.staticVersions = assetsManagerMiddleware.cacheTimestamps || 0;
          rlocals.i18n_hash = i18n.getHash(req.session.lang);
          if (app.set('env') === 'development') {
            rlocals.js_files = files;
          }
		      if (typeof(options) === 'undefined') {
		        options = {
              cache: true,
              filename: file
            };
		      }
		      options.locals = helpers.merge(options.locals, rlocals, viewHelpers);
		      try {
		        res.original_render(file, options);
		      } catch (e) {
		        console.dir(e);
		      }
		    };
		    next();
		  });
		
		  app.use(Ni.router);
		
		  app.use(Ni.renderView(function(req, res, next, filename) {
		    res.render(filename, {layout: __dirname + '/views/layout.jade'});
		  }));
      
		  app.use(function (req, res, next) {
        if ( ! req.no404 ) { // socket.io request
		      res.render(__dirname + '/views/404', {layout: __dirname + '/views/layout.jade'});
        } else {
          next();
        }
		  });
		
		  if (app.set('env') !== 'production') {
        // TODO: this will not work with the socket.io workaround!
		    app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
		  }
      
      // start the app!
	    app.listen(3002);
	    console.log('listening on 3002');
      
      //socket.io stuff
      var socket = io.listen(app); 
      socket.on('connection', function(client){ 
        client.on('message', function () {
          client.request.no404 = true;
          app.handle(client.request, client.response, function(err){
            client.send('HUHU!');
          });
        });
      }) 
		});
  });
}
