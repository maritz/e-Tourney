var fs = require('fs'),
iniparser = require('iniparser');

var basedir = __dirname + '/../i18n/'
, translations = {}
, current_hash = {};

crypto = require('crypto');

var checkHashChange = function checkHashChange (lang) {
  var new_hash = crypto.createHash('md5');
  new_hash.update(JSON.stringify(translations[lang]));
  new_hash = new_hash.digest('base64');
  current_hash[lang] = new_hash.substr(0, 10);
  // TODO: maybe we need an event here to make others aware that the translation was changed?!
}

var loadTranslations = function (lang, file) {
  try {
    iniparser.parse(basedir + lang + '/' + file, function (err, data) {
      translations[lang][file.replace(/\.ini$/, '')] = data;
      checkHashChange(lang);
    });
  } catch (e) {
    console.dir(e.stack);
  }
}

try {
  var langs = fs.readdirSync(basedir);
  if (Array.isArray(langs)) {
    langs.forEach(function (lang) {
      translations[lang] = {};
      files = fs.readdirSync(basedir + lang);
      if (Array.isArray(files)) {
        files.forEach(function (file) {
          if (file.lastIndexOf('.ini') === file.length - 4) {
            fs.watchFile(basedir + lang + '/' + file, function () {
              loadTranslations(lang, file);
            });
            loadTranslations(lang, file);
          }
        });
      }
    });
  }
} catch (e) {
  console.log('Translation file loading error:');
  console.dir(e);
}


module.exports = {
  getHash: function (lang) { 
    return current_hash[lang]; },
  getTranslations: function (lang) { 
    return translations.hasOwnProperty(lang) ? translations[lang] : {} },
  langs: Object.keys(translations),
  getTranslation: function (lang, key) {
    var reg = /([^:]*):/g
    , module = reg.exec(key)
    , indextest = reg.lastIndex,
    keystart = 0,
    orig = key;
    var section = reg.exec(key);
    if (!module || typeof(module[1]) === 'undefined' || typeof(translations[lang][module[1]]) === 'undefined') {
      if (module && typeof(module[1]) !== 'undefined') {
        section = module;
      }
      module = 'general';
    } else {
      module = module[1];
      keystart = key.indexOf(':', 0)+1;
    }
    if (!section || typeof(section[1]) === 'undefined' || typeof(translations[lang][module][section[1]]) === 'undefined') {
      section = null;
    } else {
      section = section[1];
      keystart = key.indexOf(':', keystart)+1;
    }
    key = key.substr(keystart);
    if (key.length > 0) {
      var base = section ? 
                            translations[lang][module][section]
                          : translations[lang][module];
      if (typeof(base[key]) === 'undefined') {
        // translation not found, try to find the key in en_US
        var base = section ? 
                            translations['en_US'][module][section]
                          : translations['en_US'][module];
        if (typeof(base[key]) !== 'undefined') {
          console.log('Missing translation for: ' + orig + '  in language: ' + lang);
        }
      }
      if (typeof(base[key]) === 'undefined') {
        // even with default language it can't be found.
        return '<span class="translation_error translation_missing">Translation with key: '+orig+' does not exist.\
                Parsed structure: translations['+lang+']['+module+']['+section+']['+key+'].</span>';
      } else {
        return base[key];
      }
    } else {
      return '<span class="translation_error">SPECIFIED KEY IS INVALID: '+orig+'</span>';
    }
  }
};