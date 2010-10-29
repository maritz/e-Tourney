var Ni = require('ni'),
orm = require('biggie-orm');

orm.validation_types['standard_string'] = function (input, wanted, model, callback) {
  callback(input === 'passed' ? true : false);
};