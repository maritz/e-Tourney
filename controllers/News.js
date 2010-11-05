var Ni = require('ni');

module.exports = {
  index: function(req, res, next) {
    res.Ni.controller = 'News'; // since i've overwritten the controller for home to be News, this is neccessary for automatic views
    next();
  }
};