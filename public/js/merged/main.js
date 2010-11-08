var app = new PageController();

$(document).ready(function () {
  $('#header_userbox input[type="button"]').click(function () {
    window.location = '/User/register';
  });
  
  app.userSelf = new app.models.user({self: true});
  
  var userBoxView = new app.views.userBox({ model: app.userSelf});
  
});
