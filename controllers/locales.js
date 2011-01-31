var Ni = require('ni')
, i18n = require(__dirname + '/../helpers/translations');

module.exports = {
  get: function(req, res, next, lang) {
    if (lang.indexOf('.json') !== -1) {
      lang = lang.replace(/^(.*)\.json$/i, '$1');
    }
    var dict = {
      dict: i18n.getTranslations(lang),
      hash: i18n.getHash(lang)
    }
    res.send(JSON.stringify(dict));
  }
};