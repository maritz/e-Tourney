(function () {
  var i18n_options = {
    interpolationPrefix: '{',
    interpolationSuffix: '}',
    reusePrefix: "_(" }
  , lang = 'en_US';
  

  if (Modernizr.localstorage)
    lang = localStorage['lang'] || 'en_US'; // TODO: add youtube style question "do you want your local language?"
  
  var localDict = false
  , loadJSperanto = function (dict) {
    i18n_options.dictionary = dict.dict;
    $.jsperanto.init(function(){
      _r(true);
    }, i18n_options);
  };
  
  // we try to get the dictionary from localStorage, if that fails we manually load it, store it and then initialize the translation
  try {
    localDict = JSON.parse(localStorage['dict']);
    if (localDict.hash !== i18n_hash) // compare the local dictionary version hash with the one the server provided in the layout.jade
      throw '';
    loadJSperanto(localDict);
  } catch(e) { // invalid json or local translations have expired or localstorage not available
    $.getJSON('/locales/get/'+lang+'.json', function (data) {
      if (Modernizr.localstorage)
        localStorage['dict'] = JSON.stringify(data);
      loadJSperanto(data);
    });
  }
  
  _r(function () {
    $('#top_bar_lang img').click(function () {
      var new_lang = $(this).data('lang');
      if (new_lang !== lang) {
        if (Modernizr.localstorage)
          localStorage['lang'] = new_lang;
        // make sure the user isn't sent anywhere else on the language reload
        window.location.href = window.location.protocol+'//'+window.location.host+
          window.location.pathname+'?lang='+new_lang+window.location.hash;
      }
    });
  });
})()