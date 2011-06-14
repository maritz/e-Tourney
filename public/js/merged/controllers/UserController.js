_r(function () {
  window.app.controllers.user = {
    index: function (req, res) {
      res.show()
    },
    register: function (req, res) {
      if ( ! app.userSelf.loggedIn) {
        res.show(true);
      } else {
        window.location.hash = '#user/profile';
      }
    },
    profile: function (req, res) {
      if (app.userSelf.loggedIn) {
        res.show(true);
      } else {
        window.location.hash = '#user/register';
      }
    },
    logout: function (req, res) {
      app.userSelf.logout(function () {
        window.location.reload(true);
      });
    }
  };
});