/*
 * PREDATORS
 * Online Multiplayer Game
 *
 * predators.js
 *
 * AUTHORS
 * Ridoy Majumdar (https://github.com/ridoymajumdar)
 * Matthew Violet (https://github.com/mattviolet)
 * Jake Vollkommer (https://github.com/jakevollkommer)
 */

var PredatorsCore = function() {
    this.players            = [];
    this.serverSnapshots    = [];
    this.scaleFactor        = 10;

    // Performance settings
    this.interpolationDelay = 100; // 100ms
    this.bufferSize         = 12;
};

PredatorsCore.prototype.setMap = function(map) {
    this.map       = map;
    this.mapWidth  = map.data[0].length;
    this.mapHeight = map.data.length;
};

/*
 * Client-specific functions
 */

// Set game variables and listeners when client connects
PredatorsCore.prototype.clientConnect = function() {
    var $this = this;

    // Set up client data
    this.clientTime = Date.now();
    this.keysDown   = { right: false, left: false, up: false };
    this.x          = 0;
    this.y          = 0;
    this.xVelocity  = 0;
    this.yVelocity  = 0;
    this.isOnGround = 0;
    this.id;

    // Set up view
    this.canvas        = $('#view')[0];
    this.canvas.width  = $(window).width();
    this.canvas.height = $(window).height();
    this.ctx           = this.canvas.getContext('2d');

    // Connect to remote server
    var queryParams = this.getQueryParamsFromURL();
    this.serverUrl  = queryParams['url'];
    this.socket     = io(this.serverUrl);

    // Handle connection to game server
    this.socket.on('connected', function(msg) {
        $this.id      = msg.id;
        $this.players = msg.players;
        $this.setMap(msg.map);
    });

    // Handle updates from the server
    this.socket.on('serverUpdate', function(msg) {
        // Update positions of other players
        $this.players    = msg.players;
        $this.clientTime = msg.time;
        $this.serverSnapshots.push(msg);

        // Discard oldest server update
        if ($this.serverSnapshots.length > $this.bufferSize) {
            $this.serverSnapshots.splice(0, 1);
        }

        // Update local position if different from server's record
        var thisPlayer = $this.findPlayer($this.id);
        $this.x = thisPlayer.x;
        $this.y = thisPlayer.y;
    });

    // Handle keyboard input
    $(window).keydown(function(e) {
        var direction = $this.getDirectionFromKey(e.keyCode);

        if (direction) {
            $this.keysDown[direction] = true;
            $this.sendClientStateToServer();
        }
    });

    // Handle user releasing key -- no longer apply movement in that direciton
    $(window).keyup(function(e) {
        var direction = $this.getDirectionFromKey(e.keyCode);

        if (direction) {
            $this.keysDown[direction] = false;
            $this.sendClientStateToServer();
        }
    });

    // Handle when user resizes window
    $(window).resize(function() {
        $this.canvas.width  = $(window).width();
        $this.canvas.height = $(window).height();
    });

};

PredatorsCore.prototype.sendClientStateToServer = function() {
    this.socket.emit('clientStateUpdate', {
        id: this.id,
        localX: this.x,
        localY: this.y,
        localXVelocity: this.xVelocity,
        localYVelocity: this.xVelocity,
        keysDown: this.keysDown
    });
};

PredatorsCore.prototype.checkIfOnGround = function() {
    var row = Math.floor(this.y / this.scaleFactor);
    var col = Math.floor(this.x / this.scaleFactor)

    if (row == this.mapHeight - 1) { return true; }

    var thisBlock  = this.map.data[row][col];
    var blockBelow = this.map.data[row + 1][col];

    if (blockBelow == 0) {
        return false;
    }
    // TODO tweak value
    var valueToTweak = 1;
    if (blockBelow == 1 && (this.y / scaleFactor) - row < valueToTweak) {
        return true;
    }
};

// Calculate client's position locally
PredatorsCore.prototype.clientUpdate = function() {
    var x = this.x;
    var y = this.y;

    this.checkIfOnGround();

    // Handle left/right movement
    if (this.keysDown.right) this.xVelocity = 1;
    if (this.keysDown.left)  this.xVelocity = -1;

    this.xVelocity *= 0.9; // Smoothly decelerate

    // Handle jumping
    if (this.isOnGround) {
        if (this.keysDown.up) {
            this.yVelocity = 5;
        }
    } else {
        this.yVelocity -= 1;
    }

    x += xVelocity;
    y += yVelocity;

    if (this.isWithinBoundaries(x, y)) {
        this.x = x;
        this.y = y;
    }

    this.draw();
};

// Refresh all updates
PredatorsCore.prototype.update = function() {
    requestAnimationFrame(this.update.bind(this));

    this.clientUpdate();
};

/*
 * Drawing functions
 */

PredatorsCore.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawPlayers();
};

PredatorsCore.prototype.drawBackground = function() {
// TODO You left off deliberating if there should be a scrolling background at all
    var x = -1 * (this.bg.width - this.canvas.width) / 2;
    var y = -1 * (this.bg.height - this.canvas.height) / 2;
    x -= this.x;
    y -= this.y;
    this.ctx.drawImage(this.bg, x, y);
};

PredatorsCore.prototype.drawPlayers = function() {
    // Find server positions to interpolate between
    var renderTime = this.clientTime - this.interpolationDelay;
    var prevSnapshot = null;
    var nextSnapshot = null;

    for (var i = 0; i < this.serverSnapshots.length - 1; i++) {
        var a = this.serverSnapshots[i];
        var b = this.serverSnapshots[i + 1];
        
        if (a.time <= renderTime && renderTime <= b.time) {
            prevSnapshot = a;
            nextSnapshot = b;
            break;
        }
    }

    if (!prevSnapshot || !nextSnapshot) {
        return;
    }

    // Update this.players with interpolated positions
    // TODO This can probably be done better
    var players = [];
    for (var i = 0; i < prevSnapshot.players.length; i++) {
        // Skip if current player
        if (prevSnapshot.players[i].id !== this.id) {
            var prevVector = {
                x: prevSnapshot.players[i].x,
                y: prevSnapshot.players[i].y
            };
            var nextVector = {
                x: nextSnapshot.players[i].x,
                y: nextSnapshot.players[i].y
            };
            var newPosition = this.lerp(prevVector, nextVector, renderTime / (nextSnapshot.time - prevSnapshot.time)); 
            players.push({
                x: newPosition.x,
                y: newPosition.y,
                id: prevSnapshot.players[i].id,
                keysDown: prevSnapshot.players[i].keysDown
            });
        }
    }

    // Draw self in window center
    var centerX = $(window).width() / 2;
    var centerY = $(window).height() / 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, 2*Math.PI);
    this.ctx.stroke();

    // Draw other players
    for (var i = 0; i < this.players.length; i++) {
	var player = this.players[i];
        if (player.id !== this.id) { // Don't draw self twice
            var distX = player.x - this.x;
            var distY = player.y - this.y;

            // Draw player if within window
            if (Math.abs(distX) <= centerX && Math.abs(distY) <= centerY) {
                this.ctx.beginPath();
                this.ctx.arc(distX + centerX, distY + centerY, 3, 0, 2*Math.PI);
                this.ctx.stroke();
            }
        }
    }
};

/*
 * Utility functions
 */

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
    var xValid = -1 * (this.mapHeight / 2) < x && x < this.mapHeight / 2
    var yValid = -1 * (this.mapWidth / 2) < y && y < this.mapWidth / 2

    return xValid && yValid;
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

// If on server, allow core to be require-able
if ('undefined' != typeof global) {
    module.exports = global.PredatorsCore = PredatorsCore;
}
