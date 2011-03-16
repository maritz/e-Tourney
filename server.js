var express = require('express'),
    RedisStore = require('connect-redis'),
    Ni = require('ni'),
    helpers = require(__dirname + '/helpers/general'),
    assetManager = require('connect-assetmanager'),
    assetHandlers = require('connect-assetmanager-handlers'),
    i18n = require(__dirname + '/helpers/translations.js'),
    vsprintf = require('sprintf').vsprintf,
    nohm = require('nohm'),
    io = require('socket.io'),
    socketHandler = require(__dirname + '/sockets');

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
    
		// initialize the main app
		var app = express.createServer();
		app.set('view engine', 'jade');
		
		// static stuff
		app.use(express.favicon(__dirname + '/public/images/icons/favicon.png'));
		
		// connect assetmanager to pack js. (css already handled by sass)
		var files = require(__dirname + '/helpers/collect-client-js'),
		    assetsManagerMiddleware = assetManager({
        'js': {
          'route': /\/js\/[0-9]+\/merged\.js/,
          'path': __dirname + '/public/js/merged/',
          'dataType': 'javascript',
          'files': files,
          'preManipulate': {
              'MSIE': [],
              '^': app.set('env') === 'production' ? [
                  assetHandlers.uglifyJsOptimize
              ] : [] // only minify if in production mode
          },
          'debug': app.set('env') !== 'production' // minification only in production mode
		    }
		});
		app.use(assetsManagerMiddleware);
		
		
		app.use(express['static'](__dirname + '/public')); // static is a reserved keyword ffs
		
		// start main app pre-routing stuff
		
		app.use(express.bodyParser());
		app.use(express.cookieParser());
		
    socketHandler.proxyRedisStore();
		var redisSessionStore = new RedisStore({
      magAge: 1000*60*60*24 /* one day */, 
      port: Ni.config('redis_port')
    });
		redisSessionStore.client.select(Ni.config('redis_session_db'), function () {
		  
		  app.use(express.session({
        key: Ni.config('cookie_key'),
		    secret: Ni.config('cookie_secret'),
		    store: redisSessionStore}));
        
      var trByLang = function (lang) {
        if (typeof(this.langs) === 'undefined' || typeof(this.langs[lang]) !== 'function') {
          trByLang.langs = [];
          trByLang.langs[lang] = function tr (key) { // TODO: maybe cache this on a per-language base
            var args = Array.prototype.slice.call(arguments),
                str = i18n.getTranslation(lang, key);
            args.shift();
            return vsprintf(str, args);
          };
        }
        return trByLang.langs[lang];
      };
		  
		  app.get('/', function (req, res, next) {
        if (req.accepts('json')) {
          next();
        }
        
		    var lang = req.param('lang');
		    if (typeof(lang) !== 'undefined' && i18n.langs.indexOf(lang) >= 0) {
		      req.session.lang = lang;
		    } else if (typeof(req.session.lang) === 'undefined') {
          lang = req.session.lang = 'en_US';
		    } else {
          lang = req.session.lang;
		    }
        
        res.render(__dirname+'/views/index', {
          layout: __dirname+'/views/layout',
          locals: {
            cache: true,
            tr: trByLang(lang),
            loggedClass: req.session.logged_in ? 'logged_in' : '',
    	      currentUrl: req.url,
  		      staticVersions: assetsManagerMiddleware.cacheTimestamps || 0,
            i18n_hash: i18n.getHash(req.session.lang),
            session: req.session,
            js_files: app.set('env') === 'development' ? files : false
          }
        });
		  });
		
		  app.use(function (req, res, next) {
        if (req.accepts('json')) {
          Ni.router.apply(null, arguments);
        } else {
          next();
        }
      });
      
		  app.use(function (req, res, next) {        
	      res.render(__dirname + '/views/404', {
          layout: __dirname+'/views/layout.jade',
          locals: {
            cache: true,
            tr: trByLang('en_US'),
  		      staticVersions: assetsManagerMiddleware.cacheTimestamps || 0,
            js_files: []
          }
        });
		  });
		
		  if (app.set('env') !== 'production') {
		    app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
		  }
      
      // start the app!
	    app.listen(Ni.config('app port'));
	    console.log('listening on '+Ni.config('app port'));
      
      socketHandler.setSessionStore(redisSessionStore);
      socketHandler.listen(app);
      Ni.config('socket', socketHandler.getSocket());
		});
  });
}
