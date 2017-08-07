var app = require('./app');
var port = process.env.PORT || 3000;

module.exports = app.listen(port, function() {
  console.log('Starting Nattawat\'s API server for Taskworld on port %s', port);
});
