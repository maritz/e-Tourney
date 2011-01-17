require.paths.unshift(__dirname + '/../ni/lib');
var Ni = require('ni');


// load config
require('./config');

var nohmclient = nohm.setPort(Ni.config('redis_port'));
nohmclient.select(Ni.config('redis_nohm_db'), function (err) {
  if (err) {
    console.dir(err);
    process.exit();
  }
});

exports = {
  'salt properly written/read': function (t, done) {
    var user = new User(),
    control = new User(),
    expect = 0;
    user.p({
      name: 'salt',
      email: 'salt@test.st',
      password: 'hurgelwurz'
    });
    user.save(function (err) {
      t.equal(err, null);
      control.load(user.id, function (err) {
        t.equal(err, null);
        t.equal(user.p('salt'), control.p('salt'));
        done(function () {
          t.equal(expect, 0, 'not all async tests ran');
        })
      })
    })
  },
  'salt changes password': function (t, done) {
    var user = new User(),
    control = new User();
    user.p('password', 'test');
    control.p('password', 'test');
    t.notEqual(user.p('password'), control.p('password'));
    done();
  },
  'changing the password changes the salt': function (t, done) {
    var user = new User(),
    oldSalt = user.p('salt');
    user.p('password', 'testssadsd');
    t.notEqual(user.p('salt'), oldSalt);
    done();
  },
  'test login with faulty inputs': function (t, done) {
    var user = new User(),
    expect = 1;
    user.login('login_faulty', 'asdasd', function (logged) {
      t.equal(logged, false);
      expect--;
    });
    user.p({
      name: 'login_faulty',
      email: 'login_faulty@test.st',
      password: 'hurgelwurz'
    });
    user.save(function (err) {
      user.login('login_faulty', 'asdasd', function (logged) {
        t.equal(logged, false);
        done(function () {
          t.equal(expect, 0, 'not all async tests ran');
        })
      });
    });
  },
  'test login with correct inputs': function (t, done) {
    var user = new User(),
    expect = 0;
    user.p({
      name: 'login_correct',
      email: 'login_correct@test.st',
      password: 'asdasd'
    });
    user.save(function (err) {
      var id = user.id;
      user.login('login_correct', 'asdasd', function (logged) {
        t.equal(logged, true);
        t.equal(user.id, id);
        done(function () {
          t.equal(expect, 0, 'not all async tests ran');
        });
      });
    });
  },
  'test getting basic userbox infos': function (t, done) {
    // TODO: complete this once teams/privileges are implemented (by adding seperate tests)
    var user = new User(),
    control = new User();
    user.p({
      name: 'userbox',
      email: 'userbox@mail.de',
      password: 'asd'
    });
    user.save(function (err) {
      var id = user.id;
      control.getBoxInfo(id, function (data) {
        var should = {
          id: id,
          name: user.p('name')
        };
        t.notEqual(data, false);
        t.deepEqual(should, data);
        done();
      })
    });
  },
  'end db connection': function (t) {
    //nohm.client.flushdb();
    nohm.client.quit();
  }
};