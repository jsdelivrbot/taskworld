var mongoose = require('mongoose');

var BoardSchema = new mongoose.Schema({ 
  state: {
    type: String,
    default: "initialize", // initialize (defender placing ships), start (attacker attacking), end (game over)
    enum: ["initialize", "start", "end"]
  },
  // allow users to create custom board size from 8x8 up to 16x16
  width: {
    type: Number,
    default: 10,
    required: true,
    min: 10,
    max: 25,
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value'
    }
  },
  height: {
    type: Number,
    default: 10,
    required: true,
    min: 10,
    max: 25,
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }  
});

mongoose.model('Board', BoardSchema);

module.exports = mongoose.model('Board');
