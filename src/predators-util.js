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
    var _t = (t < 0) ? 0 : ((t > 1) ? 1 : t.fixed());

    return {
        x: v1.x + _t * (v2.x - v1.x),
        y: v1.y + _t * (v2.y - v1.y)
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
 * return: target player if player exists, else null
 */
PredatorsCore.prototype.findPlayer = function(id) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].id === id) {
            return this.players[i];
        }
    }
    return null;
};
