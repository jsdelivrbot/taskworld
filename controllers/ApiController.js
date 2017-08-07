var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var async = require('async');

router.use(bodyParser.urlencoded({ extended: true }));

var Attack = require('../models/Attack');
var Board = require('../models/Board');
var Ship = require('../models/Ship');
var ShipUtil = require('../utils/ShipUtil');

router.post('/board', function (req, res) {
  Board.create({
    width : req.body.width,
    height : req.body.height
  },
  function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem adding the information to the database: " + err.message);
    }
    return sendResponse(res, 200, board);
  });
});

router.get('/boards', function (req, res) {
  Board.find({}, function (err, boards) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the boards: " + err.message);
    }
    return sendResponse(res, 200, boards);
  });
});

router.get('/board/:id', function (req, res) {
  Board.findById(req.params.id, function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the board: " + err.message);
    }
    if (!board) {
      return sendResponse(res, 404, "No board found.");
    }
    return sendResponse(res, 200, board);
  });
});

router.post('/board/:id/place', function (req, res) {
  Board.findById(req.params.id, function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the board: " + err.message);
    }
    if (!board) {
      return sendResponse(res, 404, "No board found.");
    }
    if (board.state != "initialize") {
      return sendResponse(res, 400, "The board is no longer in the initialize phase.");
    }

    var tiles = req.body.tiles;
    if (!tiles) {
      return sendResponse(res, 400, "Insufficient data.");
    }

    try {
      tiles = JSON.parse('[' + tiles + ']').sort(sortTiles);
    } catch (e) {
      return sendResponse(res, 500, "Exception: " + e.message);
    }

    // validate ship length
    if (tiles.length < 1 || tiles.length > 4) {
      return sendResponse(res, 400, "Invalid ship length.");
    }

    // check if ship can be created
    Ship.find({ boardId: board.id }, function (err, ships) {
      if (err) {
        return sendResponse(res, 500, "There was a problem finding the ships: " + err.message);
      }
      var shipTypesCount = ShipUtil.getShipTypesCount(ships);
      shipTypesCount[tiles.length]++;
      if (shipTypesCount[1] > 4 || shipTypesCount[2] > 3 || shipTypesCount[3] > 2 || shipTypesCount[4] > 1) {
        return sendResponse(res, 400, "You cannot place any more " + ShipUtil.shipNameMapping(tiles.length) + " on the board.");
      }

      // validate tiles location
      for (i = 0; i < tiles.length; i++) {
        if (tiles[i][0] < 0 || tiles[i][0] >= board.width || tiles[i][1] < 0 || tiles[i][1] >= board.height) {
          return sendResponse(res, 400, "Tiles out of bound.");
        }
      }

      // validate if it's a valid ship tiles on the grid
      var expectedShipTiles = [];
      if (tiles.length > 1) {
        if (tiles[1][0] - tiles[0][0] == 1 && tiles[1][1] == tiles[0][1]) { // horizontal ship
          for (i = 0; i < tiles.length; i++) {
            expectedShipTiles.push([tiles[0][0] + i, tiles[0][1]]);
          }
        } else if (tiles[1][1] - tiles[0][1] == 1 && tiles[1][0] == tiles[0][0]) { // vertical ship
          for (i = 0; i < tiles.length; i++) {
            expectedShipTiles.push([tiles[0][0], tiles[0][1] + i]);
          }
        } else {
          return sendResponse(res, 400, "Invalid tiles.");
        }
      } else {
        expectedShipTiles.push(tiles[0]);
      }
      if (!(tiles.length == expectedShipTiles.length && tiles.every(function(v,i) { return v[0] === expectedShipTiles[i][0] && v[1] === expectedShipTiles[i][1];}))) { // compare arrays
        return sendResponse(res, 400, "Invalid tiles.");
      }

      // validate if the ship overlaps or adjacent to other ships
      if (ShipUtil.isShipInBlackoutArea(tiles, ships, board.width, board.height)) {
        return sendResponse(res, 400, "Illegal ship placement.");
      }

      Ship.create({
        length : tiles.length,
        tiles : tiles,
        boardId : board.id
      }, 
      function (err, ship) {
        if (err) {
          return sendResponse(res, 500, "There was a problem adding the information to the database: " + err.message);
        }
        if (shipTypesCount[1] == 4 && shipTypesCount[2] == 3 && shipTypesCount[3] == 2 && shipTypesCount[4] == 1) {
          Board.update({ _id: board.id }, { $set: { state: "start" } }, function() {});
        }
        return sendResponse(res, 200, ship);
      });
    });
  });
});

router.post('/board/:id/place-auto', function (req, res) {
  Board.findById(req.params.id, function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the board: " + err.message);
    }
    if (!board) {
      return sendResponse(res, 404, "No board found.");
    }
    if (board.state != "initialize") {
      return sendResponse(res, 400, "The board is no longer in the initialize phase.");
    }
    Ship.find({ boardId: board.id }, function (err, ships) {
      if (err) {
        return sendResponse(res, 500, "There was a problem finding the ships: " + err.message);
      }
      if (ships.length > 0) {
        return sendResponse(res, 400, "Cannot auto-generate on a non-empty board. Please create a new board.");
      }
    });

    var shipMaps = [];
    var shipsLength = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    var startingTile;

    while (shipsLength.length > 0) {
      var tiles = [];
      if (getRandomInt(0, 1) === 0) { // horizontal ship
        startingTile = [getRandomInt(0, board.width - shipsLength[0]), getRandomInt(0, board.height - 1)];
        for (i = 0; i < shipsLength[0]; i++) {
          tiles.push([startingTile[0] + i, startingTile[1]]);
        }
      } else { // vertical ship
        startingTile = [getRandomInt(0, board.width - 1), getRandomInt(0, board.height - shipsLength[0])];
        for (i = 0; i < shipsLength[0]; i++) {
          tiles.push([startingTile[0], startingTile[1] + i]);
        }
      }
      if (ShipUtil.isShipInBlackoutArea(tiles, shipMaps, board.width, board.height)) {
        continue; // random again until pass
      } else {
        shipMaps.push({ length: tiles.length, tiles: tiles });
        shipsLength.splice(0, 1);
      }
    }

    async.each(shipMaps, function (shipData, callback) {
      Ship.create({
        length : shipData.length,
        tiles : shipData.tiles,
        boardId : board.id
      }, function(err) {
        if (err) {
          callback("There was a problem adding the information to the database: " + err.message);
        } else {
          callback();
        }
      });
    }, function(err) {
      if (err) {
        return sendResponse(res, 500, "There was a problem adding the information to the database: " + err.message);
      }
      Board.update({ _id: board.id }, { $set: { state: "start" } }, function() {});
      return sendResponse(res, 200, shipMaps);
    });
  });
});

// assuming the attacker can attack and miss the same tile multiple times (have to memorize which tile he attack)
// but if the ship is already hit, that tile will not be able to attack the second time
router.post('/board/:id/attack', function (req, res) {
  Board.findById(req.params.id, function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the board: " + err.message);
    }
    if (!board) {
      return sendResponse(res, 404, "No board found.");
    }
    if (board.state == "initialize") {
      return sendResponse(res, 400, "The game has not started yet.");
    } else if (board.state == "end") {
      return sendResponse(res, 400, "The game has already ended.");
    }

    var tile = req.body.tile;
    if (!tile) {
      return sendResponse(res, 400, "Insufficient data.");
    }

    try {
      tile = JSON.parse(tile);
    } catch (e) {
      return sendResponse(res, 500, "Exception: " + e.message);
    }

    if (tile.length != 2) {
      return sendResponse(res, 400, "Invalid tile.");
    }

    if (tile[0] < 0 || tile[0] >= board.width || tile[1] < 0 || tile[1] >= board.height) {
      return sendResponse(res, 400, "Attack out of bound.");
    }

    // db.getCollection('ships').find({boardId: ObjectId("5987ea03c8ab1601f730e76b"), isHit: {$not: {$elemMatch: {$nin: [true]}}}})
    // Ship.find({ boardId: board.id, isHit: { $not: { $elemMatch: { $nin: [true] } } } }, function (err, ship) {
    Ship.findOne({ boardId: board.id, tiles: tile }, function (err, ship) {
      if (err) {
        return sendResponse(res, 500, "There was a problem finding the ship: " + err.message);
      } else {
        if (ship) {
          var isHit;
          var checkResults = false;
          for (i = 0; i < ship.tiles.length; i++) {
            if (ship.tiles[i][0] == tile[0] && ship.tiles[i][1] == tile[1]) {
              isHit = ship.isHit;
              if (isHit[i] === true) { // already hit
                return sendResponse(res, 400, "The tile " + req.body.tile + " already hit a ship prior to this attack.");
              } else {
                isHit[i] = true;
                checkResults = true;
                Ship.update({ _id: ship.id }, { $set: { isHit: isHit } }, function() {});
                break;
              }
            }
          }
          if (checkResults) {
            if (isHit.every(function(a) { return a === true; })) { // if all data in isHit is true (ship = sink)
              Ship.find({ boardId: board.id, isHit: false }, function (err, ships) { // search if there are any ships left that are still alive
                if (err) {
                  return sendResponse(res, 500, "There was a problem finding the ships: " + err.message);
                }
                Attack.create({
                  boardId : board.id,
                  shipId : ship.id,
                  isKillingBlow : true,
                  tile : tile,
                  state : "hit"
                }, function (err) {
                  if (err) {
                    return sendResponse(res, 500, "There was a problem adding the information to the database: " + err.message);
                  }
                  if (ships.length === 0) { // no ship left, game over
                    Board.update({ _id: board.id }, { $set: { state: "end" } }, function() {});
                    Attack.find({ boardId: board.id }).count(function(err, attackCount) {
                      Attack.find({ boardId: board.id, state: "miss" }).count(function(err, missCount) {
                        return sendResponse(res, 200, "Win! You completed the game in " + attackCount + " moves. You made " + missCount + " missed shots.");
                      });
                    });
                  } else {
                    return sendResponse(res, 200, "You just sank the " + ship.type);
                  }
                });
              });
            } else {
              Attack.create({
                boardId : board.id,
                shipId : ship.id,
                isKillingBlow : false,
                tile : tile,
                state : "hit"
              }, function (err) {
                if (err) {
                  return sendResponse(res, 500, "There was a problem adding the information to the database: " + err.message);
                }
                sendResponse(res, 200, "Hit");
              });
            }
          }
        } else {
          Attack.create({
            boardId : board.id,
            tile : tile,
            state : "miss"
          }, function (err) {
            if (err) {
              return sendResponse(res, 500, "There was a problem adding the information to the database: " + err.message);
            }
            return sendResponse(res, 200, "Miss");
          });
        }
      }
    });
  });
});

router.get('/board/:id/status', function (req, res) {
  Board.findById(req.params.id, function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the board: " + err.message);
    }
    if (!board) {
      return sendResponse(res, 404, "No board found.");
    }

    Ship.find({ boardId: board.id }, function (err, ships) {
      var shipsData = [];
      for (i = 0; i < ships.length; i++) {
        shipsData[i] = {
          type: ships[i].type,
          tiles: ships[i].tiles,
          isSunk: ships[i].isHit.every(function(a) { return a === true; })
        };
      }
      Attack.find({ boardId: board.id }).count(function(err, attackCount) {
        Attack.find({ boardId: board.id, state: "miss" }).count(function(err, missCount) {
          return sendResponse(res, 200, {
            id: board.id,
            height: board.height,
            width: board.width,
            state: board.state,
            attacks: {
              total: attackCount,
              hit: attackCount - missCount, // hit and miss is mutually exclusive, no need to call database again
              miss: missCount
            },
            ships: shipsData
          });
        });
      });
    });
  });
});

router.get('/board/:id/attack/history', function (req, res) {
  Board.findById(req.params.id, function (err, board) {
    if (err) {
      return sendResponse(res, 500, "There was a problem finding the board: " + err.message);
    }
    if (!board) {
      return sendResponse(res, 404, "No board found.");
    }
    if (board.state == "initialize") {
      return sendResponse(res, 400, "The game has not started yet.");
    }

    var logs = ["Game started."];

    Attack.find({ boardId: board.id }, function(err, attacks) {
      for (i = 0; i < attacks.length; i++) {
        var attack = attacks[i];
        logs.push("Attack on tile [" + attack.tile[0] + ", " + attack.tile[1] + "]");
        if (attack.state == "hit" && attack.shipId !== null) {
          logs.push("It's a " + attack.state + "!");
        } else {
          logs.push("It's a miss.");
        }
      }

      if (board.state == "end") {
        logs.push("Game ended.");
      }

      return sendResponse(res, 200, logs);
    });
  });
});


function sortTiles(a,b) {
  if(a[0] === b[0]) {
    return a[1] - b[1];
  } else {
    return a[0] - b[0];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendResponse(res, code, data) {
  if (code == 200) {
    return res.status(200).send({ data: data });
  } else {
    return res.status(code).send(data);
  }
}

module.exports = router;
