_r(function () {
  window.app.controllers.user = {
    index: function (req, res) {
      res.show()
    },
    register: function (req, res) {
      res.show(true);
    },
    profile: function (req, res) {
      if (app.userSelf.loggedIn) {
        res.show(true);
      } else {
        window.location.hash = '#User/register';
      }
    }
  };
});