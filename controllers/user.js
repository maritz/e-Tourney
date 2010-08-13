"use strict";

var express = require('express');

var app = module.exports = express.createServer();

app.get('/details/:id', function (req, res, next) {
  res.send('useer ' + req.param('id'));
});
