process.env.NODE_ENV = 'test';

var mongoose = require("mongoose");

var Attack = require("../models/Attack");
var Board = require("../models/Board");
var Ship = require("../models/Ship");
var ApiController = require("../controllers/ApiController");

var app = require('../index');
var supertest = require("supertest")(app);
var should = require("should");

describe('ApiController', function() {
  // Before each test we empty the database and create one default board
  var mainBoard;

  beforeEach(function(done) {
    Board.remove({}, function(err) {
      Board.create({}, function(err, board) {
        mainBoard = board;
        done();
      });
    });
  });

  describe('POST /api/board', function() {
    it("should be successful when create new board with default values", function(done) {
      supertest
      .post("/api/board")
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.state.should.equal("initialize");
        res.body.data.width.should.equal(10);
        res.body.data.height.should.equal(10);
        done();
      });
    });

    it("should be successful when create new board with custom values", function(done) {
      supertest
      .post("/api/board")
      .type('form')
      .send({
        width: 16,
        height: 12
      })
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.state.should.equal("initialize");
        res.body.data.width.should.equal(16);
        res.body.data.height.should.equal(12);
        done();
      });
    });

    it("should not not have effect on other custom value besides width and height", function(done) {
      supertest
      .post("/api/board")
      .type('form')
      .send({
        state: "start"
      })
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.state.should.equal("initialize");
        res.body.data.width.should.equal(10);
        res.body.data.height.should.equal(10);
        done();
      });
    });

    it("should error if invalid data", function(done) {
      supertest
      .post("/api/board")
      .type('form')
      .send({
        width: "very wide",
        height: "very high"
      })
      .end(function(err, res) {
        res.status.should.equal(500);
        res.error.text.should.containEql('very wide');
        res.error.text.should.containEql('very high');
        done();
      });
    });

    describe('should error if width or height is not in between min and max (10-25)', function() {
      it("width below minimum", function(done) {
        supertest
        .post("/api/board")
        .type('form')
        .send({
          width: 9
        })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('validation failed: width');
          res.error.text.should.containEql('less than minimum');
          done();
        });
      });

      it("width exceed maximum", function(done) {
        supertest
        .post("/api/board")
        .type('form')
        .send({
          width: 26
        })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('validation failed: width');
          res.error.text.should.containEql('more than maximum');
          done();
        });
      });

      it("height below minimum", function(done) {
        supertest
        .post("/api/board")
        .type('form')
        .send({
          height: 9
        })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('validation failed: height');
          res.error.text.should.containEql('less than minimum');
          done();
        });
      });

      it("height exceed maximum", function(done) {
        supertest
        .post("/api/board")
        .type('form')
        .send({
          height: 26
        })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('validation failed: height');
          res.error.text.should.containEql('more than maximum');
          done();
        });
      });
    });

    describe('should error if width or height is not an integer', function() {
      it("width is not an integer", function(done) {
        supertest
        .post("/api/board")
        .type('form')
        .send({
          width: 12.5
        })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('validation failed: width');
          res.error.text.should.containEql('not an integer');
          done();
        });
      });

      it("height is not an integer", function(done) {
        supertest
        .post("/api/board")
        .type('form')
        .send({
          height: 24.2
        })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('validation failed: height');
          res.error.text.should.containEql('not an integer');
          done();
        });
      });
    });
  });

  describe('GET /boards', function() {
    it("should find default main board", function(done) {
      supertest
      .get("/api/boards")
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.should.be.instanceof(Array).and.have.lengthOf(1);
        done();
      });
    });

    it("should find 2 boards after creating a new one", function(done) {
      Board.create({}, 
      function (err, board) {
        supertest
        .get("/api/boards")
        .end(function(err, res) {
          res.status.should.equal(200);
          res.body.data.should.be.instanceof(Array).and.have.lengthOf(2);
          done();
        });
      });
    });
  });

  describe('GET /board/:id', function() {
    var mainBoard;

    beforeEach(function(done) {
      Board.create({}, function(err, board) {
        mainBoard = board;
        done();
      });
    });

    it("should find exact board from id", function(done) {
      supertest
      .get("/api/board/" + mainBoard.id)
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.state.should.equal("initialize");
        res.body.data.width.should.equal(10);
        res.body.data.height.should.equal(10);
        done();
      });
    });

    it("should return 500 error if board id is invalid id format", function(done) {
      supertest
      .get("/api/board/abcd")
      .end(function(err, res) {
        res.status.should.equal(500);
        res.error.text.should.containEql('abcd');
        done();
      });
    });

    it("should return 404 error if board is not found", function(done) {
      supertest
      .get("/api/board/59859115b3b9dba414dc6dcd")
      .end(function(err, res) {
        res.status.should.equal(404);
        res.error.text.should.containEql('No board found');
        done();
      });
    });
  });

  describe('POST /board/:id/place', function() {
    describe("should be able to place a ship normally", function() {
      beforeEach(function(done) {
        Ship.remove({}, function(err) { 
          done();
        });
      });

      describe("battleship", function() {
        it("horizontal", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0],[2,0],[3,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("battleship");
            res.body.data.length.should.equal(4);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[1,0],[2,0],[3,0]]);
            done();
          });
        });

        it("vertical", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[0,1],[0,2],[0,3]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("battleship");
            res.body.data.length.should.equal(4);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[0,1],[0,2],[0,3]]);
            done();
          });
        });

        it("works even with unordered tiles", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[2,0],[3,0],[1,0],[0,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("battleship");
            res.body.data.length.should.equal(4);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[1,0],[2,0],[3,0]]);
            done();
          });
        });
      });

      describe("cruiser", function() {
        it("horizontal", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0],[2,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("cruiser");
            res.body.data.length.should.equal(3);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[1,0],[2,0]]);
            done();
          });
        });

        it("vertical", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[0,1],[0,2]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("cruiser");
            res.body.data.length.should.equal(3);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[0,1],[0,2]]);
            done();
          });
        });
      });

      describe("destroyer", function() {
        it("horizontal", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("destroyer");
            res.body.data.length.should.equal(2);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[1,0]]);
            done();
          });
        });

        it("vertical", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[0,1]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("destroyer");
            res.body.data.length.should.equal(2);
            res.body.data.boardId.should.equal(mainBoard.id);
            res.body.data.tiles.should.deepEqual([[0,0],[0,1]]);
            done();
          });
        });
      });

      it("submarine", function(done) {
        supertest
        .post("/api/board/" + mainBoard.id + "/place")
        .type('form')
        .send({ tiles: "[0,0]" })
        .end(function(err, res) {
          res.status.should.equal(200);
          res.body.data.type.should.equal("submarine");
          res.body.data.length.should.equal(1);
          res.body.data.boardId.should.equal(mainBoard.id);
          res.body.data.tiles.should.deepEqual([[0,0]]);
          done();
        });
      });
    });

    it("should fail if board is not in initialize phase", function(done) {
      Board.update({ _id: mainBoard.id }, { $set: { state: "start" } }, function() {
        supertest
        .post("/api/board/" + mainBoard.id + "/place")
        .type('form')
        .send({ tiles: "[0,0]" })
        .end(function(err, res) {
          res.status.should.equal(400);
          res.error.text.should.containEql('initialize phase');
          done();
        });
      });
    });

    describe("validate each ship placement", function() {
      it("no tiles data", function(done) {
        supertest
        .post("/api/board/" + mainBoard.id + "/place")
        .end(function(err, res) {
          res.status.should.equal(400);
          res.error.text.should.containEql('Insufficient data');
          done();
        });
      });

      it("invalid tiles data", function(done) {
        supertest
        .post("/api/board/" + mainBoard.id + "/place")
        .type('form')
        .send({ tiles: "something" })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('Unexpected token');
          done();
        });
      });

      it("invalid ship length", function(done) {
        supertest
        .post("/api/board/" + mainBoard.id + "/place")
        .type('form')
        .send({ tiles: "[0,0],[1,0],[2,0],[3,0],[4,0]" })
        .end(function(err, res) {
          res.status.should.equal(400);
          res.error.text.should.containEql('Invalid ship length');
          done();
        });
      });

      it("one of tiles is not an integer", function(done) {
        supertest
        .post("/api/board/" + mainBoard.id + "/place")
        .type('form')
        .send({ tiles: "[0,0.1],[1,0.1],[2,0.1],[3,0.1]" })
        .end(function(err, res) {
          res.status.should.equal(500);
          res.error.text.should.containEql('contains a non-integer');
          done();
        });
      });

      describe("exceed amount of maximum ship", function() {
        it("battleship - limit 1 ship", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0],[2,0],[3,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("battleship");

            supertest
            .post("/api/board/" + mainBoard.id + "/place")
            .type('form')
            .send({ tiles: "[0,2],[1,2],[2,2],[3,2]" })
            .end(function(err, res) {
              res.status.should.equal(400);
              res.error.text.should.containEql('place any more battleship');
              done();
            });
          });
        });

        it("cruiser - limit 2 ships", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0],[2,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("cruiser");

            supertest
            .post("/api/board/" + mainBoard.id + "/place")
            .type('form')
            .send({ tiles: "[0,2],[1,2],[2,2]" })
            .end(function(err, res) {
              res.status.should.equal(200);
              res.body.data.type.should.equal("cruiser");

              supertest
              .post("/api/board/" + mainBoard.id + "/place")
              .type('form')
              .send({ tiles: "[0,4],[1,4],[2,4]" })
              .end(function(err, res) {
                res.status.should.equal(400);
                res.error.text.should.containEql('place any more cruiser');
                done();
              });
            });
          });
        });

        it("destroyer - limit 3 ships", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("destroyer");

            supertest
            .post("/api/board/" + mainBoard.id + "/place")
            .type('form')
            .send({ tiles: "[0,2],[1,2]" })
            .end(function(err, res) {
              res.status.should.equal(200);
              res.body.data.type.should.equal("destroyer");

              supertest
              .post("/api/board/" + mainBoard.id + "/place")
              .type('form')
              .send({ tiles: "[0,4],[1,4]" })
              .end(function(err, res) {
                res.status.should.equal(200);
                res.body.data.type.should.equal("destroyer");

                supertest
                .post("/api/board/" + mainBoard.id + "/place")
                .type('form')
                .send({ tiles: "[0,6],[1,6]" })
                .end(function(err, res) {
                  res.status.should.equal(400);
                  res.error.text.should.containEql('place any more destroyer');
                  done();
                });
              });
            });
          });
        });

        it("submarine - limit 4 ships", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.type.should.equal("submarine");

            supertest
            .post("/api/board/" + mainBoard.id + "/place")
            .type('form')
            .send({ tiles: "[0,2]" })
            .end(function(err, res) {
              res.status.should.equal(200);
              res.body.data.type.should.equal("submarine");

              supertest
              .post("/api/board/" + mainBoard.id + "/place")
              .type('form')
              .send({ tiles: "[0,4]" })
              .end(function(err, res) {
                res.status.should.equal(200);
                res.body.data.type.should.equal("submarine");

                supertest
                .post("/api/board/" + mainBoard.id + "/place")
                .type('form')
                .send({ tiles: "[0,6]" })
                .end(function(err, res) {
                  res.status.should.equal(200);
                  res.body.data.type.should.equal("submarine");

                  supertest
                  .post("/api/board/" + mainBoard.id + "/place")
                  .type('form')
                  .send({ tiles: "[0,8]" })
                  .end(function(err, res) {
                    res.status.should.equal(400);
                    res.error.text.should.containEql('place any more submarine');
                    done();
                  });
                });
              });
            });
          });
        });
      });

      describe("place ship out of bounds (based on board 10x10)", function() {
        it("horizontal lower bound", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[-1,0]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('out of bound');
            done();
          });
        });

        it("horizontal upper bound", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[10,0]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('out of bound');
            done();
          });
        });

        it("vertical lower bound", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,-1]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('out of bound');
            done();
          });
        });

        it("vertical upper bound", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,10]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('out of bound');
            done();
          });
        });
      });

      describe("tile placement does not form a ship", function() {
        it("unconnected horizontal ship", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,0],[1,0],[3,0]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('Invalid tiles');
            done();
          });
        });

        it("unconnected vertical ship", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[0,2],[0,3],[0,5]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('Invalid tiles');
            done();
          });
        });
      });

      describe("illegal tile placement (overlap/adjacent)", function() {
        beforeEach(function(done) {
          Ship.create({
            length : 4,
            tiles : [[0,0],[1,0],[2,0],[3,0]],
            boardId : mainBoard.id
          },
          function () {
            Ship.create({
              length : 3,
              tiles : [[4,4],[4,5],[4,6]],
              boardId : mainBoard.id
            },
            function () { done(); });
          });
        });

        it("horizontally adjacent", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[3,4]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('Illegal ship placement');
            done();
          });
        });

        it("diagonally adjacent", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[4,1],[5,1]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('Illegal ship placement');
            done();
          });
        });

        it("overlapping", function(done) {
          supertest
          .post("/api/board/" + mainBoard.id + "/place")
          .type('form')
          .send({ tiles: "[3,5],[4,5],[5,5]" })
          .end(function(err, res) {
            res.status.should.equal(400);
            res.error.text.should.containEql('Illegal ship placement');
            supertest
            .post("/api/board/" + mainBoard.id + "/place")
            .type('form')
            .send({ tiles: "[1,0]" })
            .end(function(err, res) {
              res.status.should.equal(400);
              res.error.text.should.containEql('Illegal ship placement');
              done();
            });
          });
        });
      });
    });
  });

  describe('POST /board/:id/place-auto', function() {
    beforeEach(function(done) {
      Ship.remove({}, function(err) { 
        done();
      });
    });

    it("should generate 10 ships successfully", function(done) {
      supertest
      .post("/api/board/" + mainBoard.id + "/place-auto")
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.should.be.instanceof(Array).and.have.lengthOf(10);
        res.body.data[0].tiles.length.should.equal(4);
        res.body.data[1].tiles.length.should.equal(3);
        res.body.data[2].tiles.length.should.equal(3);
        res.body.data[3].tiles.length.should.equal(2);
        res.body.data[4].tiles.length.should.equal(2);
        res.body.data[5].tiles.length.should.equal(2);
        res.body.data[6].tiles.length.should.equal(1);
        res.body.data[7].tiles.length.should.equal(1);
        res.body.data[8].tiles.length.should.equal(1);
        res.body.data[9].tiles.length.should.equal(1);
        done();
      });
    });

    // describe('validation', function() {
    //   it("should not generate if there is already a ship created", function(done) {
    //     Ship.create({
    //       length : 3,
    //       tiles : [[4,4],[4,5],[4,6]],
    //       boardId : mainBoard.id
    //     },
    //     function () {
    //       supertest
    //       .post("/api/board/" + mainBoard.id + "/place-auto")
    //       .end(function(err, res) {
    //         res.status.should.equal(400);
    //         res.error.text.should.containEql('non-empty board');
    //         done();
    //       });
    //     });
    //   });
    // });
  });

  describe('POST /board/:id/attack', function() {
    // for testing purpose the board will only have 2 ships
    beforeEach(function(done) {
      Board.update({ _id: mainBoard.id }, { $set: { state: "start" } }, function() {});
      Attack.remove({}, function() {
        Ship.remove({}, function(err) {
          Ship.create({
            length : 2,
            tiles : [[4,4],[4,5]],
            boardId : mainBoard.id
          },
          function () {
            Ship.create({
              length : 1,
              tiles : [[7,2]],
              boardId : mainBoard.id
            },
            function () {
              done();
            });
          });
        });
      });
    });

    it("should attack and missed the target on the empty tile", function(done) {
      supertest
      .post("/api/board/" + mainBoard.id + "/attack")
      .type('form')
      .send({ tile: "[0,0]" })
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.should.containEql('Miss');
        done();
      });
    });

    it("should attack and hit the destroyer but not sink the ship", function(done) {
      supertest
      .post("/api/board/" + mainBoard.id + "/attack")
      .type('form')
      .send({ tile: "[4,5]" })
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.should.containEql('Hit');
        done();
      });
    });

    it("should attack and hit the submarine and then sink the ship", function(done) {
      supertest
      .post("/api/board/" + mainBoard.id + "/attack")
      .type('form')
      .send({ tile: "[7,2]" })
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.should.containEql('sank the submarine');
        done();
      });
    });

    it("should attack 4 times, missed 1, sink all the ship, and win the game", function(done) {
      supertest
      .post("/api/board/" + mainBoard.id + "/attack")
      .type('form')
      .send({ tile: "[4,4]" })
      .end(function(err, res) {
        res.status.should.equal(200);
        res.body.data.should.containEql('Hit');

        supertest
        .post("/api/board/" + mainBoard.id + "/attack")
        .type('form')
        .send({ tile: "[4,3]" })
        .end(function(err, res) {
          res.status.should.equal(200);
          res.body.data.should.containEql('Miss');

          supertest
          .post("/api/board/" + mainBoard.id + "/attack")
          .type('form')
          .send({ tile: "[4,5]" })
          .end(function(err, res) {
            res.status.should.equal(200);
            res.body.data.should.containEql('sank the destroyer');

            supertest
            .post("/api/board/" + mainBoard.id + "/attack")
            .type('form')
            .send({ tile: "[7,2]" })
            .end(function(err, res) {
              res.status.should.equal(200);
              res.body.data.should.containEql('completed the game');
              res.body.data.should.containEql('4 moves');
              res.body.data.should.containEql('1 missed');
              done();
            });
          });
        });
      });
    });

    it("should error if tile is not an integer", function(done) {
      supertest
      .post("/api/board/" + mainBoard.id + "/attack")
      .type('form')
      .send({ tile: "[0,0.1]" })
      .end(function(err, res) {
        res.status.should.equal(500);
        res.error.text.should.containEql('contains a non-integer');
        done();
      });
    });
  });
});
