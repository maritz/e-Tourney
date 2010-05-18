require.paths.unshift('lib')
require.paths.unshift('lib/express')
require('express')
require('express/plugins')

var sys = require('sys'),
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


var quicklist = [
  {
    id: 'official',
    name: 'Offizielle',
    tourns: [
      'turnier 1',
      'haha'
    ]  
  },
  {
    id: 'inofficial',
    name: 'Inoffizielle',
    tourns: [
      'turnier 16'
    ]  
  }
];

get(/^\/?([^\.]*)$/, function(file){
  file = ( file && file !== 'layout' ) ? file : 'index';
  if (haml_check_file(file)) {
    this.render(file + '.html.haml', 
      {
        locals: {
          quicklist: quicklist,
          show_quicklist: (file !== 'tourn')
        }
      }, function (what, view) {
      this.response.headers['Content-Type'] = 'text/html; charset=utf-8';
      this.respond(200, view);
    });
  } else {
    this.pass('error/404');
  }
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
var childProcess = require('child_process').exec;
process.env.PATH += ':/home/maritz/.gem/ruby/1.8/bin'; // wtf man?!
process.env.PATH += ':/var/lib/gems/1.9.0/bin'; /* ok, this is getting ridiculous. i need a solution to this... :/
The problem here is, that installing sass either requires sudo rights and installs it to /var/lib/gems/blablabla and doesn't add the binaries to your path, or you install without sudo and it installs in ~/.gem/ruby/1.8/bin ...
It all sucks... :D */
childProcess("sass --debug-info --watch " + sass_dir + '', function(err, stdout, stderr) {
  if (stdout)
    sys.debug(stdout);
  if (err)
    sys.debug(sys.inspect('PROBLEM compiling scss file: ' + err));
});

run(undefined, null);

