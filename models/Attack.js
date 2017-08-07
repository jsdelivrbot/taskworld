var mongoose = require('mongoose');

var AttackSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  },
  shipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ship',
    default: null
  },
  state: {
    type: String,
    enum: ["hit", "miss"],
    required: true
  },
  isKillingBlow: { // does this attack cause the ship to sink?
    type: Boolean,
    default: false
  },
  tile: {
    type: [Number],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }  
});

AttackSchema.path('tile').validate(function(tile) {
  for (i = 0; i < tile.length; i++) {
    if (tile[i] % 1 !== 0) {
      return false;
    }
  }
  return true;
}, '{VALUE} contains a non-integer value');

mongoose.model('Attack', AttackSchema);

module.exports = mongoose.model('Attack');
