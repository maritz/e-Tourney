_r(function () {
  window.app = new PageController();
}, true);

_r(function () {
  Backbone.history.start();
  
  $('#reload_page').live('click', function () {
    window.app.reload();
  });
  
  $('#header_userbox input[type="button"]').click(function () {
    window.location = '#user/register';
  });
  
  // we don't really want the link to change the address bar here.
  $('#top_bar_logged a[href="#user/logout"]').click(function (e) {
    e.preventDefault();
    app.controllers.user.logout();
  });
  
});

window.registry = {
  selfName: 'Guest'+(+new Date()),
  form_fieldcheck_timeout: window.form_fieldcheck_timeout
};