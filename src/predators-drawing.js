/*
 * Drawing functions
 */

PredatorsCore.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawCoins();
    this.drawPlayers();
    this.drawLeaderboard();
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

PredatorsCore.prototype.drawCoins = function() {
    this.ctx.strokeStyle = 'rgb(255,215,0)';
    this.ctx.fillStyle = 'rgb(255,215,0)';
    for (var coin of this.coins) {
        if (coin.type === 'normal') {
            this.ctx.strokeStyle = 'rgb(255,215,0)';
            this.ctx.fillStyle   = 'rgb(255,215,0)';
        } else if (coin.type === 'powerup') {
            this.ctx.strokeStyle = 'rgb(255,0,0)';
            this.ctx.fillStyle   = 'rgb(255,0,0)';
        }

        this.ctx.beginPath();
        this.ctx.arc(coin.position.x, coin.position.y, this.coinRadius, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }
};

PredatorsCore.prototype.drawPlayers = function() {
    if (this.player.canKill) this.ctx.strokeStyle = 'rgb(255,0,0)';
    else this.ctx.strokeStyle = 'rgb(0,0,0)';
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.playerRadius, 0, 2*Math.PI);
    this.ctx.stroke();

    // Draw all players
    for (var i = 0; i < this.players.length; i++) {
	    var player = this.players[i];
        if (player.id !== this.id) {
            if (player.canKill) this.ctx.strokeStyle = 'rgb(255,0,0)';
            else this.ctx.strokeStyle = 'rgb(0,0,0)';

            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, this.playerRadius, 0, 2*Math.PI);
            this.ctx.stroke();
        }
    }
};

PredatorsCore.prototype.drawLeaderboard = function() {
    this.ctx.strokeStyle = 'rgb(0,0,0)';
    this.ctx.fillStyle = 'rgba(0,0,0, 0.1)';
    var boxX = 500;
    var boxY = 10;
    this.ctx.fillRect(boxX, boxY, 100, 100);
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = 'rgba(0,0,0,1)';
    this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    for (var i = 0; i < this.leaderboard.length; i++) {
        var name = this.leaderboard[i].name;
        var score = this.leaderboard[i].score;
        this.ctx.fillText(name + ' ' + score, boxX + 10, boxY + 10 + 20*i);
    }
};
