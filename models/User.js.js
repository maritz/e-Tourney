var Ni = require('ni'),
orm = require('biggie-orm');

module.exports = orm.model('User', {
  name: {
    type: 'string',
    unique: true,
    required: true
  }
});