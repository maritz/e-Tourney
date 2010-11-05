var fs = require('fs');

var files = []
, basedir = 'public/js/merged/';

var getFiles = function getFiles (path) {
  try {
    var things = fs.readdirSync(basedir + path);
    if (Array.isArray(things)) {
      things.forEach(function (value, i) {
        if (value.lastIndexOf('.js') !== value.length - 3) {
          getFiles(path + value + '/');
        } else {
          files.unshift(path + value);
        }
      });
    }
  } catch (e) {
  }
}

getFiles('');

module.exports = files;