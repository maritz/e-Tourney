require.paths.unshift(__dirname + '/../ni/lib');
var Ni = require('ni')
, nohm = require('nohm')
, User = require(__dirname+'/../models/User')
, nohmclient
, assert = require('assert')
, util = require('util')
, timeout = 0;

var args = process.argv.slice(2)
, startInstructions = 'You need to start the tests with "expresso -s -t 8000" or "expresso -s --no-timeout-check" if you know what you\'re doing.';
if (args.indexOf('-s') === -1 && args.indexOf('--serial') === -1) {
  console.log(startInstructions);
  process.exit(1);
}
if (args.indexOf('-t') === -1 && args.indexOf('--timeout') === -1 && args.indexOf('--no-timeout-check') === -1) {
  console.log(startInstructions);
  process.exit(1);
} else if (args.indexOf('--no-timeout-check') === -1){
  var arg = args.indexOf('-t') === -1 ? '--timeout' : '-t'
  , pos = args.indexOf(arg);
  timeout = parseInt(args[pos+1], 10);
  console.log(timeout);
  if (timeout < 8000) {
    console.log(startInstructions);
    process.exit(1);
  }
}

// load config
require(__dirname+'/../config');

nohm.connect(Ni.config('redis_port'), Ni.config('redis_host'));
nohmclient = nohm.getClient();

module.exports = {
  'flushdb warning': function (done) {
    console.log('ATTENTION! This will flush db 0 of your configured redis server in '+(timeout/1000).toFixed(1)+' seconds!\n');
    var time = +new Date()+timeout
    , interval = setInterval(function () {
      var current = +new Date();
      if (current >= time)
        return clearInterval(interval);
      util.print('\r'+((time-current)/1000).toFixed(1));
    }, 100);
    setTimeout(function () {
      nohmclient.flushdb();
      done();
    }, timeout);
  },
  'salt properly written/read': function (done) {
    var user = new User(),
    control = new User(),
    expect = 0;
    user.p({
      name: 'salt',
      password: 'hurgelwurz'
    });
    user.save(function (err) {
      if (err == 'invalid')
        console.dir(user.errors);
      assert.equal(err, null);
      control.load(user.id, function (err) {
        assert.equal(err, null);
        assert.equal(user.p('salt'), control.p('salt'));
        done(function () {
          console.log('exiting');
          assert.equal(expect, 0, 'not all async tests ran');
        });
      });
    });
  },
  'empty password invalidates': function (done) {
    var user = new User();
    user.p('password', '');
    assert.equal(user.valid('password'),false);
    assert.deepEqual(user.errors.password, ['notEmpty']);
    done();
  },
  'short password invalidates': function (done) {
    var user = new User();
    user.p('password', 'test');
    assert.equal(user.valid('password'),false);
    assert.deepEqual(user.errors.password, ['minLength']);
    done();
  },
  'salt changes password': function (done) {
    var user = new User(),
    control = new User();
    user.p('password', 'testtest');
    control.p('password', 'testtest');
    assert.notEqual(user.p('password'), control.p('password'));
    done();
  },
  'changing the password changes the salt': function (done) {
    var user = new User(),
    oldSalt = user.p('salt');
    user.p('password', 'testssadsd');
    assert.notEqual(user.p('salt'), oldSalt);
    done();
  },
  'test login with faulty inputs': function (done) {
    var user = new User(),
    expect = 1;
    user.login('login_faulty', 'asdasd', function (logged) {
      assert.equal(logged, false);
      expect--;
    });
    user.p({
      name: 'login_faulty',
      password: 'hurgelwurz'
    });
    user.save(function (err) {
      user.login('login_faulty', 'asdasd', function (logged) {
        assert.equal(logged, false);
        done(function () {
          assert.equal(expect, 0, 'not all async tests ran');
        });
      });
    });
  },
  'test login with correct inputs': function (done) {
    var user = new User(),
    expect = 0;
    user.p({
      name: 'login_correct',
      email: 'login_correct@tesassert.st',
      password: 'asdasd'
    });
    user.save(function (err) {
      var id = user.id;
      user.login('login_correct', 'asdasd', function (logged) {
        assert.equal(logged, true);
        assert.equal(user.id, id);
        done(function () {
          assert.equal(expect, 0, 'not all async tests ran');
        });
      });
    });
  },
  'test getting basic userbox infos': function (done) {
    // TODO: complete this once teams/privileges are implemented (by adding seperate tests)
    var user = new User(),
    control = new User();
    user.p({
      name: 'userbox',
      password: 'asdasd'
    });
    user.save(function (err) {
      var id = user.id;
      control.getBoxInfo(id, function (data) {
        var should = {
          id: id,
          name: user.p('name')
        };
        assert.notEqual(data, false);
        assert.deepEqual(should, data);
        done();
      });
    });
  },
  'end db connection': function (done) {
    nohmclient.quit();
    done();
  }
};
