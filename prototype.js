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

get(/^\/?([^\.]*)$/, function(file){
  file = ( file && file !== 'layout' ) ? file : 'index';
  if(haml_check_file(file))
    this.render(file + '.haml.html', null, function (what, view) {
      this.response.headers['Content-Type'] = 'text/html; charset=utf-8';
      this.halt(200, view);
    });
  else
    this.pass('error/404');
});

get('/favicon.ico', function(){
  this.halt();
});

get('/error/404', function () {
  this.halt('404', 'Not found');
});


// haml file check
var haml_check_file = function (name) {
  var file = name + '.html.haml';
  var files = fs.readdirSync(set('views'));
  return files.indexOf(file) !== -1;
}

// sass conversion
var childProcess = require('child_process').exec,
    sass_files = fs.readdirSync(sass_dir),
    found_files = sass_files.length,
    processed_files = 0,
    old_cwd = process.cwd();

process.chdir(sass_dir);
process.env.PATH += ':/home/maritz/.gem/ruby/1.8/bin'; // wtf man?!

sass_files.forEach(function (i) {
  if(i.lastIndexOf('.sass') !== -1 && i !== '.sass-cache') { // not a css file
    var name = i.substring(i.lastIndexOf('/'), i.lastIndexOf('.sass'));
    if (name.substr(0,1) !== '_') { // sass file meant only for importing
      childProcess("sass " + name + '.sass ' + name + '.css', function(err, stdout, stderr) {
        if (stdout)
          debug(stdout);
        if (err)
          debug(inspect('PROBLEM calling "sass ' + name + '.sass ' + name + '.css" with file "' + i + '" ' + err));
        processed_files++;
      });
    } else {
      processed_files++;
    }
  } else {
    processed_files++;
  }
});

process.chdir(old_cwd);

var startExpressInterval = setInterval(function () {
  if (processed_files === found_files) {
    clearInterval(startExpressInterval);
    run(undefined, null);
  }
}, 100);
