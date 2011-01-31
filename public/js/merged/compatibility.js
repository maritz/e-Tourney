/* 
 * This javascript checks whether the browser of the user is compatible with this site.
 * If not, a "warning" is displayed and options are presented to correct this gross misconduct.
 */

var compatible = true;
if (!Modernizr.localstorage) {
  compatible = false;
  _r(function () {
    $.jGrowl($.t('general.messages.localStorage_missing'), {sticky: true, theme: 'warning'});
  });
}
