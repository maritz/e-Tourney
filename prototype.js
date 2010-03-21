process.mixin(GLOBAL, require('sys'));

require.paths.unshift('lib')
require.paths.unshift('lib/express')
require('express')
require('express/plugins')

var messages = [],
    utils = require('express/utils'),
    fs = require('fs'),
    sass_dir = './public/prototype/css/';
    
configure(function(){
  enable('show exceptions');
  enable('helpful 404');
  use(MethodOverride);
  use(ContentLength);
  use(Cookie);
  use(Cache, {lifetime: (5).minutes, reapInterval: (1).minute});
  use(Session, {lifetime: (15).minutes, reapInterval: (1).minute});
  use(Logger);
  set('root', __dirname);
  set('views',__dirname + '/views/prototype/');
  use(Static);
});

get(/^\/?([^\.]*$)/, function(file){
  file = ( file && file !== 'layout' ) ? file : 'index';
  this.render(file + '.haml.html');
});

get('/favicon.ico', function(){
  this.halt()
});

// sass conversion
var sass_files = fs.readdirSync(sass_dir),
    found_files = sass_files.length,
    processed_files = 0,
    old_cwd = process.cwd();

process.chdir(sass_dir);
process.env.PATH += ':/home/maritz/.gem/ruby/1.8/bin'; // wtf man?!

sass_files.forEach(function (i) {
  if(i.lastIndexOf('.sass') !== -1 && i !== '.sass-cache') { // not a css file
    var name = i.substring(i.lastIndexOf('/'), i.lastIndexOf('.sass'));
    if (name.substr(0,1) !== '_') { // sass file meant only for importing
      var sass = process.createChildProcess("sass", [name + '.sass', name + '.css']);
      sass.addListener("exit", function (exitcode) {
        processed_files++;
      }).addListener('error', function (e) {
        if (e)
          debug(inspect('PROBLEM calling "sass ' + name + '.sass ' + name + '.css" with file "' + i + '" ' + e));
      });
    } else {
      processed_files++;
    }
  } else {
    processed_files++;
  }
})

process.chdir(old_cwd);

var startExpressInterval = setInterval(function () {
  if (processed_files === found_files) {
    clearInterval(startExpressInterval);
    run(undefined, null);
  }
}, 100);
