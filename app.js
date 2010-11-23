"use strict";

require.paths.unshift(__dirname + '/../ni/lib');
var fs = require('fs'),
Ni = require('ni'),
redis = require('redis'),
child_process = require('child_process');

process.on('uncaughtException', function(excp) {
  if (excp.message || excp.name) {
    if (excp.name) process.stdout.write(excp.name);
    if (excp.message) process.stdout.write(excp.message);
    if (excp.backtrace) process.stdout.write(excp.backtrace);
    if (excp.stack) process.stdout.write(excp.stack);
  } else {
    util = require('util');
    process.stdout.write(util.inspect(excp));    
  }
});

// sass watch hack :(
var sassfiles = fs.readdirSync(__dirname + '/public/css/default');
for (var i = 0, len = sassfiles.length; i < len; i = i + 1) {
  if (sassfiles[i].match(/\.scss$/i)) {
    fs.watchFile(__dirname + '/public/css/default/' + sassfiles[i], function () {
      console.log('file changed');
      child_process.spawn('touch', [__dirname + '/public/css/default/style.scss']);
    });
  }
}

// cloud9 sends SIGTERM but for some reason that doesn't propagate to the child processes.
process.on('SIGTERM', function () {
  console.log('Got SIGTERM, closing sass and redis');
  sass.kill();
  redis_server.kill();
});

// sass does not communicate well at all, so we just ignore sass output here -.-
var sass = child_process.spawn('/var/lib/gems/1.8/bin/sass', ['--debug-info', '--watch', __dirname + '/public/css/default/style.scss']);


// real application starts now!

// load config
require('./config');

// load server
var server = require('./server');

// check if the redis server is there
var tests = 0;
var redis_server = null;
var started = false;
var testClient = redis.createClient(Ni.config('redis_port'), 
                                    Ni.config('redis_host'));
testClient.on('error', function (err) {
  console.log('failed to connect to redis - trying to start it.');
  if (!started) {
    started = true;
    console.log('starting redis');
    redis_server = child_process.spawn('/usr/local/bin/redis-server', 
      [__dirname + '/etourney-redis.conf'], 
      {cwd: __dirname});
  }
  tests++;
  if (tests > 5) {
    console.log('5th redis connection failure; shutting down; something is wrong with your redis!');
    process.exit(1);
  }
});
testClient.on('connect', function () {
  // redis server up, start server!
  console.log('redis is up');
  testClient.quit();
  testClient.removeAllListeners('error');
  server.start();
});
