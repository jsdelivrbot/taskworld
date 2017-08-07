var mongoose = require('mongoose');
var config = require('config');

// Mongoose's default connection logic is deprecated as of 4.11.0
// http://mongoosejs.com/docs/connections.html#use-mongo-client
mongoose.connect(config.mongodb_uri, {
  useMongoClient: true
});
