PredatorsCore.prototype.coinUpdateLoop = function() {
    if (this.coins) {
        if (this.coins.length === 0) {
            for (var i = 0; i < this.numCoins; i++) {
                this.generateCoin();
            }
        } else if (this.coins.length < this.numCoins) {
            this.generateCoin();
        }
    }
};

PredatorsCore.prototype.generateCoin = function() {
    var coinValid = false;
    var newCoin;
    while (!coinValid) {
        var rand = Math.random();
        var coinType = (rand > 0.2) ? 'normal' : 'powerup';
        newCoin = {
            position: {
                x: Math.random() * this.mapWidth * this.scaleFactor,
                y: Math.random() * this.mapHeight * this.scaleFactor
            },
            type: coinType
        };

        // Check that coin is not in the map, then say coin is valid
        coinValid = true;

    }

    this.coins.push(newCoin);

};

PredatorsCore.prototype.activateKillPower = function(player) {
    player.canKill = true;
    player.powerupExpire = Date.now() + 5000;
};

PredatorsCore.prototype.updatePositionHistory = function(players, time) {
    this.positionHistory.push({
        players: players,
        time: time
    });

    if (this.positionHistory.length > 120) {
        this.positionHistory.shift();
    }
};

PredatorsCore.prototype.confirmKill = function(captor, victim, clientTime, interpolationDelay) {
    var execTime = clientTime - interpolationDelay;

    // Check if execTime is outside of the server's record, something messed up
    if (execTime < this.positionHistory[0].time
            || execTime > this.positionHistory[this.positionHistory.length - 1].time) {
        return false;
    }

    // Iterate over position history
    var min = Math.abs(this.positionHistory[0].time - execTime);
    var closestRecord = this.positionHistory[0];
    for (var i = 1; i < this.positionHistory.length; i++) {
        if (Math.abs(this.positionHistory[i].time - execTime) < min) {
            min = this.positionHistory[i].time - execTime;
            closestRecord = this.positionHistory[i];
        }
    }

    // Compare positions of player and victim
    var captorPos = {};
    var victimPos = {};

    for (var player of this.players) {
        if (player.id === captor.id) {
            captorPos.x = player.x;
            captorPos.y = player.y;
        }

        if (player.id === victim.id) {
            victimPos.x = player.x;
            victimPos.y = player.y;
        }
    }

    if (this.distance(captorPos, victimPos) < 3 * this.playerRadius) {
        return true;
    }
}

PredatorsCore.prototype.updateLeaderboard = function() {
    // Pick top 10 players by score
    var players = [];
    for (var player of this.players) {
        players.push({
            name: player.name,
            score: player.score
        });
    }

    players.sort(function(a, b) { 
        if (a.score > b.score) return -1;
        else if (b.score > a.score) return 1;
        else return 0;
    });

    this.leaderboard = players.slice(0, 10);
};
