var Ni = require('ni');

var userController = module.exports = {
  __init: function (cb, req, res, next) {
    if (!req.session.logged_in) {
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
  }
}