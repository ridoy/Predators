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

