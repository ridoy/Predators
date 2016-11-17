/* 
 * Client functions
 */

// Set game variables and listeners when client connects
PredatorsCore.prototype.clientConnect = function() {
    var $this = this;

    // Set up client data
    this.clientTime = Date.now();
    this.keysDown   = { right: false, left: false, up: false };
    this.x          = 100;
    this.y          = 100;
    this.xVelocity  = 0;
    this.yVelocity  = 0;
    this.isOnGround = 0;
    this.id;

    // Set up view
    this.canvas        = $('#view')[0];
    this.ctx           = this.canvas.getContext('2d');
    this.playerRadius  = 5;

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
        localX: this.x,
        localY: this.y,
        localXVelocity: this.xVelocity,
        localYVelocity: this.xVelocity,
        keysDown: this.keysDown
    });
};

// Calculate client's position locally for one tick
PredatorsCore.prototype.clientUpdate = function() {
    var x = this.x;
    var y = this.y;

    // Handle left/right movement
    if (this.keysDown.right) this.xVelocity = 3;
    if (this.keysDown.left)  this.xVelocity = -3;

    this.xVelocity *= 0.9; // Smoothly decelerate

    // Handle jumping
    if (this.isOnGround) {
        if (this.keysDown.up) {
            this.isOnGround = false;
            this.yVelocity = 10;
        } else {
            this.yVelocity = 0;
        }
    } else {
        // Calculate the user's position in the next tick
        var tempYVelocity = this.yVelocity - 0.5;

        var newRow = Math.floor((this.y + this.playerRadius - tempYVelocity) / this.scaleFactor);
        var newCol = Math.floor(this.x / this.scaleFactor);

        if (this.map[newRow][newCol] === 1) { // If the user will be in the ground in the next tick
            // Then bounce back up to the surface
            this.yVelocity = -1 * ((newRow * this.scaleFactor) - (this.y + this.playerRadius));
            this.isOnGround = true;
        } else { // User is still in the air
            this.yVelocity = tempYVelocity;
        }
    }

    x += this.xVelocity;
    y -= this.yVelocity;

    if (this.isWithinBoundaries(x, y)) {
        this.x = x;
        this.y = y;
    } else { // push back
        this.xVelocity *= -2;
        x = this.x + this.xVelocity;
        this.x = x;
    }

    this.draw();
};

// Refresh all updates
PredatorsCore.prototype.updateLoop = function() {
    requestAnimationFrame(this.updateLoop.bind(this));

    this.clientUpdate();
};
