var User = require('User'),
nohm = require('nohm');
nohm.client.select(3);
nohm.client.flushdb();

module.exports = {
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
  'end db connection': function (t) {
    //nohm.client.flushdb();
    nohm.client.quit();
  }
};