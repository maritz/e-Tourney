var PageController = function (spec) {
  this.config = {
  };
  _.extend(this.config, spec);


  this.models = {};
  this.views = {};
}