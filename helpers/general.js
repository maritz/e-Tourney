exports.merge = function () {
  var result = {};
  for (var i = arguments.length - 1; i >= 0; i--) {
    if (typeof(arguments[i]) === 'object') {
      var obj = arguments[i];
      Object.keys(obj).forEach(function () {
        result[arguments[0]] = obj[arguments[0]];
      });
    }
  }
  return result;
}