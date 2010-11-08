var Ni = require('ni');

module.exports = {
  index: function(req, res, next) {
    res.Ni.controller = 'News'; // since i've overwritten the controller for home to be News, this is neccessary for automatic views
    next();
  },
  restore: function (req, res, next) {
    var redis = require('redis').createClient();
    redis.flushdb(function () {
      var user = new Ni.models.User();
      user.p({
        name: 'maritz',
        email: 'maritz@juststars.de',
        password: 'asdasd'
      });
      user.save(function (err) {
        res.send(err ? 'FEHLER' : 'ERFOLGREICH');
      });
    });
  }
};