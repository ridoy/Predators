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
    this.ctx.arc(this.x, this.y, this.playerRadius, 0, 2*Math.PI);
    this.ctx.stroke();

    // Draw all players
    for (var i = 0; i < this.players.length; i++) {
	    var player = this.players[i];
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, this.playerRadius, 0, 2*Math.PI);
        this.ctx.stroke();
    }
};

