"use strict";

var hashing = require('hashlib'),
seed = 'PBbipb)(B32p98Ba8p7svbdaps9bF/()/ebf3fbpaiusbpF(/!"§R%NBAs9iufbb9837bfP!)UNDp97a8sbc',
nohm = require('nohm');
module.exports = nohm.Model.extend({
  constructor: function () {
    this.modelName = 'User';
    this.properties = {
      name: {
        type: 'string',
        unique: true,
        validations: [
          'notEmpty'
        ]
      },
      password: {
        type: 'string',
        index: true,
        validations: [
          'notEmpty'
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
      barred: {
        type: 'bool',
        value: false
      },
      barredUntil: {
        type: 'timestamp',
        index: true
      }
    };
    nohm.Model.call(this);
  },
  passwordHash: function (pw) {
    pw = pw.substr(pw.length / 2 + 1, pw.length) + seed + pw.substr(0, pw.length / 2);
    return hashing.sha512(pw);
  }
});
