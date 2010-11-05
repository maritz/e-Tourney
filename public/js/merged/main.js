$(document).ready(function () {
  $('#header_login input[type="button"]').click(function () {
    window.location = '/user/register';
  });
  
  $('#header_login form').submit(function (e) {
    e.preventDefault();
    var data = $(this).serializeArray();
    $.post('User/loginJson', data, function (response, success) {
      if (response.success) {
        console.log('login successfull');
      } else {
        console.log('login FAILED!');
      }
    });
  });
});