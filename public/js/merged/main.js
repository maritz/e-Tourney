_r(function () {
  window.app = new PageController();
}, true);

_r(function () {
  Backbone.history.start();
  
  $('#reload_page').live('click', function () {
    window.app.reload();
  });
  
  $('#header_userbox input[type="button"]').click(function () {
    window.location = '#User/register';
  });
});