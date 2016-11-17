/*
 * Predators Core
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
    this.playerRadius       = 5;

    // Performance settings
    this.interpolationDelay = 100; // 100ms
    this.bufferSize         = 12;
};

// If on server, allow core to be require-able
if ('undefined' != typeof global) {
    module.exports = global.PredatorsCore = PredatorsCore;
}

/* 
 * Client functions
 */

// Set game variables and listeners when client connects
PredatorsCore.prototype.clientConnect = function() {
    var $this = this;

    // Set up client data
    this.clientTime = Date.now();
    this.player = {
        x: 100,
        y: 100,
        xVelocity: 0,
        yVelocity: 0,
        isOnGround: false,
        keysDown: { right: false, left: false, up: false },
    };

    // Set up view
    this.canvas       = $('#view')[0];
    this.ctx          = this.canvas.getContext('2d');
    this.playerRadius = 5;

    // Connect to remote server
    var queryParams = this.getQueryParamsFromURL();
    this.serverUrl  = queryParams['url'];
    this.socket     = io(this.serverUrl);

    // Handle connection to game server
    this.socket.on('connected', function(msg) {
        $this.id      = msg.id;
        $this.players = msg.players;

        // Resize canvas to fit map
        $this.setMap(msg.map);
        $this.canvas.width  = $this.mapWidth * $this.scaleFactor;
        $this.canvas.height = $this.mapHeight * $this.scaleFactor;

        // Center the canvas
        $this.canvas.style.marginLeft  = 'auto'
        $this.canvas.style.marginRight = 'auto'

        // Begin game processing and drawing
        $this.updateLoop();
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
        /*
         TODO reinstate
        $this.x = thisPlayer.x;
        $this.y = thisPlayer.y;
        */
    });

    // Handle keyboard input
    $(window).keydown(function(e) {
        var direction = $this.getDirectionFromKey(e.keyCode);
        if (direction) {
            $this.player.keysDown[direction] = true;
            $this.sendClientStateToServer();
        }
    });

    // Handle user releasing key -- no longer apply movement in that direciton
    $(window).keyup(function(e) {
        var direction = $this.getDirectionFromKey(e.keyCode);

        if (direction) {
            $this.player.keysDown[direction] = false;
            $this.sendClientStateToServer();
        }
    });

    /*
    // Handle when user resizes window
    $(window).resize(function() {
        $this.canvas.width  = $(window).width();
        $this.canvas.height = $(window).height();
    });
    */

};

PredatorsCore.prototype.sendClientStateToServer = function() {
    this.socket.emit('clientStateUpdate', {
        id: this.id,
        localX: this.player.x,
        localY: this.player.y,
        localXVelocity: this.player.xVelocity,
        localYVelocity: this.player.xVelocity,
        keysDown: this.player.keysDown
    });
};

PredatorsCore.prototype.calculateXAfterOneTick = function(player) {
    // Handle left/right movement
    if (player.keysDown.right) player.xVelocity = 3;
    if (player.keysDown.left)  player.xVelocity = -3;

    player.xVelocity *= 0.9; // Smoothly decelerate

    return player.x + player.xVelocity;
}

PredatorsCore.prototype.calculateYAfterOneTick = function(player) {
    var prevX = player.x;
    var prevY = player.y;

    // Handle jumping
    if (player.isOnGround) {
        if (player.keysDown.up) {
            player.isOnGround = false;
            player.yVelocity = 10;
        } else {
            player.yVelocity = 0;
        }
    } else {
        // Calculate the user's position in the next tick
        var tempYVelocity = player.yVelocity - 0.5;
        var scaleFactor   = player.scaleFactor || this.scaleFactor || 10;
        var playerRadius  = player.playerRadius || this.playerRadius || 5;

        var newRow = Math.floor((prevY + playerRadius - tempYVelocity) / scaleFactor);
        var newCol = Math.floor(prevX / scaleFactor);

        // If the user will be in the ground in the next tick, then bounce back up to the surface
        if (this.map[newRow][newCol] === 1) { 
            player.yVelocity = -1 * ((newRow * scaleFactor) - (prevY + playerRadius));
            player.isOnGround = true;
        } else { // User is still in the air
            player.yVelocity = tempYVelocity;
        }
    }

    return prevY - player.yVelocity;
}

// Calculate player's movement for one tick
PredatorsCore.prototype.updatePlayerPosition = function(player) {
    var x = this.calculateXAfterOneTick(player);
    var y = this.calculateYAfterOneTick(player);

    if (!this.isWithinBoundaries(x, y)) { // Hitting wall, push back
        player.xVelocity *= -2;
        x = player.x + player.xVelocity;
    }

    player.x = x;
    player.y = y;
};

PredatorsCore.prototype.generateNewPlayer = function() {
    return {
        x: 100,
        y: 100,
        xVelocity: 0,
        yVelocity: 0,
        isOnGround: false,
        keysDown: { 'left': false, 'right': false, 'up': false, 'down': false }
    };
};

// Refresh all updates
PredatorsCore.prototype.updateLoop = function() {
    requestAnimationFrame(this.updateLoop.bind(this));

    this.updatePlayerPosition(this.player);
    this.draw();
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
    var scaleFactor = this.scaleFactor;
    this.ctx.fillStyle = 'rgb(0,0,0)';
    for (var r = 0; r < this.mapHeight; r++) {
        for (var c = 0; c < this.mapWidth; c++) {
            if (this.map[r][c] == 1) {
                // draw block
                this.ctx.fillRect(c * scaleFactor, r * scaleFactor, scaleFactor, scaleFactor);
            }
        }
    }
};

PredatorsCore.prototype.drawPlayers = function() {
    /*
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
    */

    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.playerRadius, 0, 2*Math.PI);
    this.ctx.stroke();

    // Draw all players
    for (var i = 0; i < this.players.length; i++) {
	    var player = this.players[i];
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, this.playerRadius, 0, 2*Math.PI);
        this.ctx.stroke();
    }
};


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
