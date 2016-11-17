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

    // Performance settings
    this.interpolationDelay = 100; // 100ms
    this.bufferSize         = 12;
};

// If on server, allow core to be require-able
if ('undefined' != typeof global) {
    module.exports = global.PredatorsCore = PredatorsCore;
}
