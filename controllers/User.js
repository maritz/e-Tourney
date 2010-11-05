var Ni = require('ni');

var userController = module.exports = {
  __init: function (cb, req, res, next) {
    if (!req.session.logged_in && res.Ni.action.indexOf('login') !== 0) {
      res.Ni.action = 'login';
      Ni.controllers.User.login(req, res, next);
    } else {
      cb();
    }
  },
  
  index: function (req, res, next) {
    next();
	},
  
  login: function (req, res, next) {
    next();
  },
  
  loginJson: function (req, res, next) {
    var response = {
      result: null,
      user: null
    };
    setTimeout(function () { // artificial delay to make bruteforcing less practical
      var user = new Ni.models.User();
      user.login(req.body.name, req.body.password, function (logged) {
        if (logged) {
          response.result = true;
          response.user = { id: user.id }
        } else {
          response.result = false;
        }
        res.send(response);
      });
    }, 400);
  }
}