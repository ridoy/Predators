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
    this.serverSnapshots    = []; // For client
    this.positionHistory    = []; // For server
    this.coins              = [];
    this.numCoins           = 50;
    this.coinRadius         = 3;
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
