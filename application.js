"use strict";

var sass_dir = './public/prototype/css/',
express = require('express'),
conductor = require('conductor'),
MemoryStore = require('connect/middleware/session/memory');

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

// initialize the main app
var app = express.createServer();
app.set('view engine', 'jade');

if (app.set('env') !== 'production') {
  app.use(express.lint(app));
}


// static stuff
app.use(express.staticProvider('./public'));

// start main app pre-routing stuff
app.use(express.bodyDecoder());
app.use(express.cookieDecoder());
app.use(express.session({ store: new MemoryStore({ reapInterval: 60000 * 10 }) }));

app.use('/user', require('./controllers/user'));

app.get('', function (req, res, next) {
  console.dir(req.session);
  res.render('index', {
    locals: {
      session: req.session,
      quicklist: quicklist
    }
  });
});

console.dir(require('./controllers/user'));


app.get('*', function (req, res, next) {
  res.send('<html><head><title>404 - Not found.</title></head><body>Not found.</body></html>');
});

app.use(express.errorHandler({ showStack: true }));


app.listen(3000);
console.log('listening on 3000');

















// sass conversion
var childProcess = require('child_process').spawn;
process.env.PATH += ':/home/maritz/.gem/ruby/1.8/bin'; // wtf man?!
process.env.PATH += ':/var/lib/gems/1.9.0/bin'; /* ok, this is getting ridiculous. i need a solution to this... :/
The problem here is, that installing sass either requires sudo rights and installs it to /var/lib/gems/blablabla and doesn't add the binaries to your path, or you install without sudo and it installs in ~/.gem/ruby/1.8/bin ...
It all sucks... :D */

// first kill possibly other sass processes.
var kill = childProcess('killall', ['sass']);
kill.on('exit', function () {
  var sass = childProcess('sass', [/*'--debug-info', */'--watch', sass_dir]);
  sass.stdout.on('data', function (data) {
    console.log('sass output: ' + data);
  });
  sass.stderr.on('data', function (data) {
    if (data.toString() !== '\n' && // ...
        data.toString() !== 'Warning: Unable to load rb-inotify >= 0.5.1. Inotify will be unavailable.\n' &&
        data.toString() !== 'Warning: Unable to load rb-inotify >= 0.5.1. Inotify will be unavailable.') {
      console.log('PROBLEM compiling scss file: ' + data);
      console.dir(data.toString());
    }
  });
  sass.on('exit', function (code) {
    console.log('sass exited with code ' + code);
  });
});
