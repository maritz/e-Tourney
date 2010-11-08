/* 
 * This javascript checks whether the browser of the user is compatible with this site.
 * If not, a "warning" is displayed and options are presented to correct this gross misconduct.
 * Setting 
 */

$(document).ready(function () {
  var compatible = true;
  if (!Modernizr.localStorage) {
    compatible = false;
  }
});
