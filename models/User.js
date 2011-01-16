var Ni = require('ni'),
nohm = require('nohm'),
crypto = require('crypto');

var hasher = function hasher (password, salt) {
  var hash = crypto.createHash('sha512');
  hash.update(password);
  hash.update(salt);
  return hash.digest('base64');
}

// thanks to senchalabs for this uid snippet
var uid = function uid () {
  return ((Date.now() & 0x7fff).toString(32) + (0x100000000 * Math.random()).toString(32));
}

var userModel = module.exports = nohm.Model.extend({
  constructor: function () {
    this.modelName = 'User';
    this.properties = {
      name: {
        type: 'string',
        unique: true,
        validations: [
          'notEmpty',
          ['minLength', 4]
        ]
      },
      email: {
        type: 'string',
        unique: true,
        validations: [
          'notEmpty',
          'email'
        ]
      },
      password: {
        load_pure: true, // this ensures that there is no typecasting when loading from the db.
        type: function (value, key, old) {
          var pwd, salt;
          if (value) {
            pwd = hasher(value, this.p('salt'));
            if (pwd !== old) {
              // if the password was changed, we change the salt as well, just to be sure.
              salt = uid();
              this.p('salt', salt);
              pwd = hasher(value, salt);
            }
            return pwd;
          } else {
            return null;
          }
        },
        validations: [
          'notEmpty'
        ]
      },
      salt: {
        // DO NOT CHANGE THE SALT, IT WILL INVALIDATE THE STORED PASSWORD!
        // only valid exception is of course if the password is changed.
        value: uid()
      }
    };
    nohm.Model.call(this);
  },
  
  login: function (name, password, callback) {
    var self = this;
    if (!name || name === '' || !password || password === '') {
      callback(false);
      return;
    }
    this.find({name: name}, function (err, ids) {
      if (ids.length === 0) {
        callback(false);
      } else {
        // optimization possibility: do a custom redis query
        self.load(ids[0], function (err) {
          if (!err && self.p('password') === hasher(password, self.p('salt'))) {
            callback(true);
          } else {
            callback(false);
          }
        });
      }
    });
  },
  
  getBoxInfo: function (id, callback) {
    var info = {},
    self = this,
    userLoaded =  function (err) {
      if (err) {
        callback(false);
      } else {
        info.id = self.id;
        info.name = self.p('name');
        // and then we also get the privilege level and teamlist.
        callback(info);
      }
    };
    if (!this.__loaded && id) {
      this.load(id, userLoaded)
    } else if (this.id && this.__loaded) {
      userLoaded();
    } else {
      callback(false);
    }
  },
  
  fill: function (obj, validate) {
    if (typeof(obj) !== 'object' || !obj) {
      obj = {};
    }
    delete obj.salt;
    for (field in obj) {
      if (obj.hasOwnProperty(field) && !this.properties.hasOwnProperty(field)) {
        delete obj.field;
      }
    }
    return this.p(obj, validate);
  }
});