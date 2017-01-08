/*
 * Utility functions
 */

/*
 * Set the map for this game
 * params: map (2D array of 1s and 0s representing the map)
 * return: none
 */
PredatorsCore.prototype.setMap = function(map) {
    this.map       = map;
    this.mapWidth  = this.map[0].length;
    this.mapHeight = this.map.length;
};

/*
 * Grab query params from URL
 * params: none
 * return: an object containing key/value params from url
 */
PredatorsCore.prototype.getQueryParamsFromURL = function() {
    var queryString  = location.search;
    var splitQS      = queryString.split('&');
    var params       = {};
    for (var i = 0; i < splitQS.length; i++) {
        var keyValuePair = splitQS[i].split('='); 
        params[keyValuePair[0]] = keyValuePair[1];
    }
    return params;
};

PredatorsCore.prototype.distance = function(v1, v2) {
    return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
};

PredatorsCore.prototype.removeCoin = function(coin) {
    for (var i = 0; i < this.coins.length; i++) {
        if (coin.position.x === this.coins[i].position.x
            && coin.position.y === this.coins[i].position.y) {
            this.coins.splice(i, 1);
            return true;
        }
    }
    return false;
};

/*
 * Arrow key keycode to direction string
 * params: key (code of key pressed)
 * return: if arrow key, String of arrow key, else false
 */
PredatorsCore.prototype.getDirectionFromKey = function(key) {
    if (key === 37) {
        return 'left';
    } else if (key === 38) {
        return 'up';
    } else if (key === 39) {
        return 'right';
    } else {
        return false;
    }
};

/*
 * Linear interpolation between two vectors
 * params: v1 (first/previous vector)
 *         v2 (second/next vector)
 *         t  (length of timestep)
 * return: Position between v1 and v2
 */
PredatorsCore.prototype.lerp = function(v1, v2, t) {
    // Validate 0 < t < 1
    var _t = Number(t);
    _t = (_t < 0) ? 0 : ((_t > 1) ? 1 : _t.toFixed(5));

    var dx   = v2.x - v1.x;
    var dy   = v2.y - v1.y;
    var newX = v1.x + _t * dx;
    var newY = v1.y + _t * dy;

    return {
        x: newX,
        y: newY
    }
};

/*
 * Check if position is within boundaries
 * params: x (x coordinate)
 *         y (y coordinate)
 * return: true if legal false if illegal
 */
PredatorsCore.prototype.isWithinBoundaries = function(x, y) {
    var xValid = 0 < x && x < this.mapWidth * this.scaleFactor;
    var yValid = 0 < y && y < this.mapHeight * this.scaleFactor;

    return xValid && yValid;
};

/*
 * Check if position is inside a filled block
 * params: x (x coordinate)
 *         y (y coordinate)
 * return: true if legal false if illegal
 */
PredatorsCore.prototype.isInWall = function(x, y) {
    var colRightEdge = Math.floor((x + this.playerRadius) / this.scaleFactor);
    var colLeftEdge  = Math.floor((x - this.playerRadius) / this.scaleFactor);
    var row = Math.floor(y / this.scaleFactor);

    return this.map[row][colLeftEdge] === 1 || this.map[row][colRightEdge] === 1;
};

/*
 * Finds player by id
 * params: id (id of target player)
 *         (optional) players (array of players to search)
 * return: target player if player exists, else null
 */
PredatorsCore.prototype.findPlayer = function(id, players) {
    if (!players) var players = this.players;

    for (var player of players) {
        if (player.id === id) {
            return player;
        }
    }
    return null;
};
