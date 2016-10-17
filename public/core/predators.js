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

var debug = true;

var PredatorsCore = function() {
    this.players    = [];
    this.speedMult  = .1;
};

// Set game variables and listeners when client connects
PredatorsCore.prototype.clientConnect = function() {
    var $this = this;

    this.socket        = io();
    this.position      = { x: 0, y: 0, theta: 0 };
    this.keysDown      = { right: false, left: false, up: false, down: false };
    this.canvas        = $('#view')[0];
    this.canvas.width  = $(window).width();
    this.canvas.height = $(window).height();
    this.ctx           = this.canvas.getContext('2d');
    this.bg            = new Image();
    this.bg.src        = '/img/grid.png';
    this.id;

    // Handle connection to game server
    this.socket.on('connected', (msg) => {
        $this.id      = msg.id;
        $this.players = msg.players;
    });

    // Handle updates from the server
    this.socket.on('serverUpdate', (msg) => {
        // Update positions of other players
        this.players = msg.players;

        // Update local position
        var thisPlayer = this.findPlayer(this.id);
        this.position.x = thisPlayer.x;
        this.position.y = thisPlayer.y;
    });

    // Handle player following mouse
    $(window).mousemove((e) => {
        var centerX = $(window).width() / 2;
        var centerY = $(window).height() / 2;
        var theta   = Math.atan2(e.clientY - centerY, e.clientX - centerX); 


        $this.position.theta = theta;
        $this.sendClientStateToServer();
    });

    // Handle when user resizes window
    $(window).resize(() => {
        $this.canvas.width  = $(window).width();
        $this.canvas.height = $(window).height();
    });
};

PredatorsCore.prototype.findPlayer = function(id) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].id === id) {
            return this.players[i];
        }
    }
    return null;
};

PredatorsCore.prototype.sendClientStateToServer = function() {
    this.socket.emit('clientStateUpdate', {
        id: this.id,
        localX: this.position.x,
        localY: this.position.y,
        theta: this.position.theta
    });
};

// FOR DEBUG: Print x and y of current player in topleft corner
PredatorsCore.prototype.updateStatsConsole = function() {
    if (debug) {
        var str = "x: " + Math.round(this.position.x) + ", y: " + Math.round(this.position.y);
        this.ctx.fillStyle = "blue";
        this.ctx.font = "12px Times";
        this.ctx.fillText(str, 10, 10);
    }
};

// Update position of client
PredatorsCore.prototype.clientUpdate = function() {
    var x = this.position.x;
    var y = this.position.y;

    x += Math.cos(this.position.theta) * this.speedMult;
    y -= Math.sin(this.position.theta) * this.speedMult;

    this.position.x = x;
    this.position.y = y;
    this.updateStatsConsole();
    this.draw();
};

// Refresh all updates
PredatorsCore.prototype.update = function() {
    requestAnimationFrame(this.update.bind(this));

    this.clientUpdate();
};

PredatorsCore.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawPlayers();
};

PredatorsCore.prototype.drawPlayers = function() {
    // Draw self in window center
    var centerX = $(window).width() / 2;
    var centerY = $(window).height() / 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, 2*Math.PI);
    this.ctx.stroke();

    for (var player of this.players) {
        if (player.id !== this.id) { // Don't draw self twice
            var distX = player.x - this.position.x;
            var distY = player.y - this.position.y;

            // Draw player if within window
            if (Math.abs(distX) <= centerX && Math.abs(distY) <= centerY) {
                this.ctx.beginPath();
                this.ctx.arc(distX + centerX, distY + centerY, 3, 0, 2*Math.PI);
                this.ctx.stroke();
            }
        }
    }
};

PredatorsCore.prototype.drawBackground = function() {
    var x = -1 * (this.bg.width - this.canvas.width) / 2;
    var y = -1 * (this.bg.height - this.canvas.height) / 2;
    x -= this.position.x;
    y += this.position.y;
    this.ctx.drawImage(this.bg, x, y);
};


// If on server, allow core to be require-able
if('undefined' != typeof global) {
    module.exports = global.PredatorsCore = PredatorsCore;
}
