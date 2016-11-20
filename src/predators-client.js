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
        $this.clientUpdateLoop();
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

PredatorsCore.prototype.interpolateOtherPlayers = function() {
    // Find server positions to interpolate between
    var renderTime   = this.clientTime - this.interpolationDelay;
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
            prevPosition = prevSnapshot.players[i];
            nextPosition = nextSnapshot.players[i];
            var newPosition = this.lerp(prevPosition, nextPosition, renderTime / (nextSnapshot.time - prevSnapshot.time)); 

            players.push({
                x: newPosition.x,
                y: newPosition.y,
                id: prevSnapshot.players[i].id,
                keysDown: prevSnapshot.players[i].keysDown
            });
        }
    }

    this.players = players;
}

// Refresh all updates
PredatorsCore.prototype.clientUpdateLoop = function() {
    requestAnimationFrame(this.clientUpdateLoop.bind(this));

    this.updatePlayerPosition(this.player);
    this.interpolateOtherPlayers();
    this.draw();
};
