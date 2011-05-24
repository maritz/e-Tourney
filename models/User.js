var Ni = require('ni'),
    nohm = require('nohm').Nohm,
    crypto = require('crypto');

var hasher = function hasher (password, salt) {
  var hash = crypto.createHash('sha512');
  hash.update(password);
  hash.update(salt);
  return hash.digest('base64');
};

// thanks to senchalabs for this uid snippet
var uid = function uid () {
  return ((Date.now() & 0x7fff).toString(32) + (0x100000000 * Math.random()).toString(32));
};

var password_minlength = 6;

var userModel = module.exports = nohm.model('User', {
  properties: {
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
        ['email', true]
      ]
    },
    password: {
      load_pure: true, // this ensures that there is no typecasting when loading from the db.
      type: function (value, key, old) {
        var pwd, salt,
            valueDefined = value && typeof(value.length) !== 'undefined';
        if ( valueDefined && value.length >= password_minlength) {
          pwd = hasher(value, this.p('salt'));
          if (pwd !== old) {
            // if the password was changed, we change the salt as well, just to be sure.
            salt = uid();
            this.p('salt', salt);
            pwd = hasher(value, salt);
          }
          return pwd;
        } else {
          return value;
        }
      },
      validations: [
        'notEmpty',
        ['minLength', password_minlength]
      ]
    },
    salt: {
      // DO NOT CHANGE THE SALTING METHOD, IT WILL INVALIDATE STORED PASSWORDS!
      // only valid exception is of course if the password is changed.
      defaultValue: uid()
    }
  },
  methods: {
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
          // TODO: get the privilege level and teamlist.
          callback(info);
        }
      };
      if (!this.__loaded && id) {
        this.load(id, userLoaded);
      } else if (this.id && this.__loaded) {
        userLoaded();
      } else {
        callback(false);
      }
    },
    
    fill: function (data, fields, fieldCheck) {
      var props = {},
          passwordInField,
          passwordChanged = false,
          self = this,
          doFieldCheck = typeof(fieldCheck) === 'function';
          
      fields = Array.isArray(fields) ? fields : Object.keys(data);
      
      fields.forEach(function (i) {
        var fieldCheckResult;
        
        if (i === 'salt' || // make sure the salt isn't overwritten
            ! self.properties.hasOwnProperty(i))
          return;
          
        if (doFieldCheck)
          fieldCheckResult = fieldCheck(i, data[i]);
          
        if (doFieldCheck && fieldCheckResult === false)
          return;
        else if (doFieldCheck && typeof (fieldCheckResult) !== 'undefined' &&
                fieldCheckResult !== true)
          return (props[i] = fieldCheckResult);
          
        
        props[i] = data[i];
      });
     
      this.p(props);
      return props;
    },
    
    create: function (data, callback) {
      var self = this;
      
      this.fill(data, true);
      this.save(callback);
    },
    
    checkProperties: function (data, fields, callback) {
      var self = this;    
      callback = typeof(fields) === 'function' ? fields : callback;
      
      this.fill(data, fields);
      this.valid(false, false, callback);
    }
  }
});