# Taskworld
Battleship assignment for Taskworld by Nattawat Choojirawong

## Installation
To run this project locally, first clone into the computer's repository
```
git clone https://github.com/minnat/taskworld.git
```
Now you will have to install npm packages and dependencies before running.
```
npm install
```
Voilà! That's all! To start a server, it's as simple as
```
npm start
```
The server will be located at
```
http://localhost:3000
```
where you can use postman to call the API from this base address

and to run the test
```
npm test
```

## Test it on Heroku!
If you do not wish to install it on local server, you can test it on my remote heroku address that I have deployed.
```
https://limitless-everglades-67784.herokuapp.com
```

## API Routes

To summarize what this Battleship API can do, here are some simple breakdowns:
- Create a new board game
- View all existing board games
- View specific board game
- Manually place a ship onto the board, one-by-one
- Automatically fill the board with all the ships and have it ready to play
- Attack on a specific grid
- View game status
- View attack history

When using POST method to submit data, *please make sure that the body is set to x-www-form-urlencoded and not form-data*

### Create a new board game
```
POST /api/board
```
This created a new board game. By the default the board grid is 10x10 size, but you can personalize the game by creating a different board size from 10x10 up to 25x25.

#### Accepting variables
- width: Integer _(min 10, max 25)_
- height: Integer _(min 10, max 25)_

#### Response
```
{
    "data": {
        "__v": 0,
        "_id": "59888147c09d134078f01033",
        "createdAt": "2017-08-07T15:03:35.626Z",
        "height": 10,
        "width": 10,
        "state": "initialize"
    }
}
```

### View all existing board games
```
GET /api/boards
```
This retrieve all board games in the system and display them in the array of boards, with `_id`, `createdAt`, `height`, `width` and `state`

### View specific board games
```
GET /api/board/:id
```
_Note: `:id` represents the board game id found the the responses above_
This retrieve an information about specific board, with `_id`, `createdAt`, `height`, `width` and `state`

### Manually place a ship onto the board, one-by-one
```
POST /api/board/:id/place
```
This allow the user to manually place a ship on a board, one ship per API call. The ship can be in any type, depending on the tiles the user choose.

#### Accepting variables
- tiles: [[Integer]]

For example: `[2,2], [2,3], [2,4], [2,5]`

#### Response
```
{
    "data": {
        "__v": 0,
        "type": "battleship",
        "length": 4,
        "boardId": "59888147c09d134078f01033",
        "_id": "598882e3c09d134078f01034",
        "createdAt": "2017-08-07T15:10:27.171Z",
        "isHit": [
            false,
            false,
            false,
            false
        ],
        "tiles": [
            [
                2,
                2
            ],
            [
                2,
                3
            ],
            [
                2,
                4
            ],
            [
                2,
                5
            ]
        ]
    }
}
```

### Automatically fill the board with all the ships and have it ready to play
```
POST /api/board/:id/place-auto
```
This option is for single player who does not have another opponent as Defender to place the ship where they want. This API will auto-generated and place all the ships on the board randomly, allowing the player to get into attacking mode immediately.

_Note: The response is quite long, so I did not paste it here. It is basically the mapping of all the ships placed and the tiles they are on._

### Attack on a specific grid
```
POST /api/board/:id/attack
```
The attacker select a tile to attack, then submit to see if the attack hit any ship or miss.

#### Accepting variables
- tile: [Integer]

For example: `[5,5]`

#### Response
```
{
    "data": "Miss"
}
```
```
{
    "data": "Hit"
}
```
```
{
    "data": "You just sank the battleship"
}
```
```
{
    "data": "Win! You completed the game in 51 moves. You made 29 missed shots."
}
```

### View game status
```
GET /api/board/:id/status
```
A more organized information of the board game. This include more information such as the number of attacks (and hit/miss) and the current state of the ships, and whether they are already sunk or not.

#### Response
```
{
    "data": {
        "id": "598883f1c09d134078f01035",
        "height": 10,
        "width": 10,
        "state": "start",
        "attacks": {
            "total": 1,
            "hit": 0,
            "miss": 1
        },
        "ships": [
            {
                "type": "battleship",
                "tiles": [
                    [
                        9,
                        2
                    ],
                    [
                        9,
                        3
                    ],
                    [
                        9,
                        4
                    ],
                    [
                        9,
                        5
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "cruiser",
                "tiles": [
                    [
                        1,
                        7
                    ],
                    [
                        1,
                        8
                    ],
                    [
                        1,
                        9
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "destroyer",
                "tiles": [
                    [
                        7,
                        9
                    ],
                    [
                        8,
                        9
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "submarine",
                "tiles": [
                    [
                        9,
                        7
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "destroyer",
                "tiles": [
                    [
                        1,
                        4
                    ],
                    [
                        1,
                        5
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "destroyer",
                "tiles": [
                    [
                        6,
                        7
                    ],
                    [
                        7,
                        7
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "submarine",
                "tiles": [
                    [
                        4,
                        5
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "submarine",
                "tiles": [
                    [
                        9,
                        0
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "cruiser",
                "tiles": [
                    [
                        5,
                        2
                    ],
                    [
                        6,
                        2
                    ],
                    [
                        7,
                        2
                    ]
                ],
                "isSunk": false
            },
            {
                "type": "submarine",
                "tiles": [
                    [
                        5,
                        9
                    ]
                ],
                "isSunk": false
            }
        ]
    }
}
```
### View attack history
```
GET /api/board/:id/attack/history
```
View a log of the attacks made onto the board in text form from game start until the game end.

#### Response
```
{
    "data": [
        "Game started.",
        "Attack on tile [5, 5]. It's a miss.",
        "Attack on tile [9, 4]. It's a hit!"
    ]
}
```

## Notes
This is a project built exclusively for Taskworld. If you have any question please feel free to contact me directly. You have my info.
