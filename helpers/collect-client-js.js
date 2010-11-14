var fs = require('fs');

var files = []
, basedir = 'public/js/merged/';

var getFiles = function getFiles (path) {
  try {
    var things = fs.readdirSync(basedir + path);
    if (Array.isArray(things)) {
      things.sort();
      things.forEach(function (value, i) {
        if (value.lastIndexOf('.js') === value.length - 3) {
          files.push(path + value);
        }
      });
    }
  } catch (e) {
  }
}

// reverse order of how it ends up in the merged files.
getFiles('libs/');
getFiles('controllers/');
getFiles('models/');
getFiles('views/');
getFiles('');

module.exports = files;