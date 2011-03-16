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
  
  window.socket = new io.Socket();
  socket.connect();
  socket.on('connect', function(){
    console.log('connected');
  });
  socket.on('message', function(msg){
    console.dir(msg);
    $.jGrowl(msg);
  });
  socket.on('disconnect', function(){
    console.log('disconnect');
  })
});