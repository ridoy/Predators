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
        newCoin = {
            x: Math.random() * this.mapWidth * this.scaleFactor,
            y: Math.random() * this.mapHeight * this.scaleFactor
        };

        // Check that coin is not in the map, then say coin is valid
        coinValid = true;
    }

    this.coins.push(newCoin);

}
