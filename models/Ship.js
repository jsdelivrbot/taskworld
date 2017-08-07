var mongoose = require('mongoose');
var ShipUtil = require('../utils/ShipUtil');

var ShipSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  },
  type: {
    type: String,
    enum: ["submarine", "destroyer", "cruiser", "battleship"]
  },
  length: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  tiles: {
    type: [[Number]],
    required: true
  },
  isHit: {
    type: [Boolean]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ShipSchema.pre('save', function(next) {
  this.type = ShipUtil.shipNameMapping(this.length);
  for (i = 0; i < this.length; i++) {
    this.isHit.push(false);
  }
  next();
});

ShipSchema.path('tiles').validate(function(tiles) {
  for (i = 0; i < tiles.length; i++) {
    for (j = 0; j < tiles[i].length; j++) {
      if (tiles[i][j] % 1 !== 0) {
        return false;
      }
    }
  }
  return true;
}, '{VALUE} contains a non-integer value');

mongoose.model('Ship', ShipSchema);

module.exports = mongoose.model('Ship');
