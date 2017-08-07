function ShipUtil() {}

ShipUtil.shipNameMapping = function(length) {
  var mapping = {
    1: "submarine",
    2: "destroyer",
    3: "cruiser",
    4: "battleship"
  };

  return mapping[length];
};

ShipUtil.getShipTypesCount = function(ships) {
  var shipTypesCount = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0
  };
  for (i = 0; i < ships.length; i++) {
    shipTypesCount[ships[i].length]++;
  }

  return shipTypesCount;
};

ShipUtil.isShipInBlackoutArea = function(shipTiles, ships, boardWidth, boardHeight) {
  var blackoutTiles = getBlackoutTiles(ships, boardWidth, boardHeight);
  for (var i = 0; i < shipTiles.length; i++) {
    for (var j = 0; j < blackoutTiles.length; j++) {
      if (shipTiles[i][0] == blackoutTiles[j][0] && shipTiles[i][1] == blackoutTiles[j][1]) {
        return true;
      }
    }
  }

  return false;
};

function getBlackoutTiles(ships, boardWidth, boardHeight) {
  var blackoutTiles = [];

  for (i = 0; i < ships.length; i++) {
    if (ships[i].tiles.length == 1 || ships[i].tiles[1][0] - ships[i].tiles[0][0] == 1) { // horizontal ship or submarine
      for (j = -1; j <= ships[i].tiles.length; j++) {
        blackoutTiles.push([ships[i].tiles[0][0] + j, ships[i].tiles[0][1] - 1]);
        blackoutTiles.push([ships[i].tiles[0][0] + j, ships[i].tiles[0][1]]);
        blackoutTiles.push([ships[i].tiles[0][0] + j, ships[i].tiles[0][1] + 1]);
      }
    } else if (ships[i].tiles[1][1] - ships[i].tiles[0][1] == 1) { // vertical ship
      for (j = -1; j <= ships[i].tiles.length; j++) {
        blackoutTiles.push([ships[i].tiles[0][0] - 1, ships[i].tiles[0][1] + j]);
        blackoutTiles.push([ships[i].tiles[0][0], ships[i].tiles[0][1] + j]);
        blackoutTiles.push([ships[i].tiles[0][0] + 1, ships[i].tiles[0][1] + j]);
      }
    }
  }

  blackoutTiles = blackoutTiles.filter(function(blackoutTile){
    return blackoutTile[0] >= 0 && blackoutTile[1] >= 0 && blackoutTile[0] < boardWidth && blackoutTile[1] < boardHeight;
  });

  return multiDimensionalUnique(blackoutTiles);
}

function multiDimensionalUnique(arr) {
  var uniques = [];
  var itemsFound = {};
  for (var i = 0, l = arr.length; i < l; i++) {
    var stringified = JSON.stringify(arr[i]);
    if (itemsFound[stringified]) {
      continue;
    }
    uniques.push(arr[i]);
    itemsFound[stringified] = true;
  }

  return uniques;
}

function tileExistsInBlackoutTiles(blackoutTiles, tile) {
  for (var i = 0; i < tile.length; i++) {
    for (var j = 0; j < blackoutTiles.length; j++) {
      if (tile[i][0] == blackoutTiles[j][0] && tile[i][1] == blackoutTiles[j][1]) {
        return true;
      }
    }
  }

  return false;
}

module.exports = ShipUtil;
