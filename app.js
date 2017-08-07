var express = require('express');
var app = express();
var db = require('./db');

var ApiController = require('./controllers/ApiController');

app.use('/api', ApiController);

module.exports = app;
