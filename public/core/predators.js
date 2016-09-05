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

var PredatorsCore = function() {
    this.players = [];
};

PredatorsCore.prototype.clientConnect = function() {
    this.socket   = io();
    this.position = { 
        x: 0, 
        y: 0,
        theta: 0
    };
    this.isMoving = false
    this.canvas   = $('#view')[0];
    this.ctx      = this.canvas.getContext('2d');

    $(window).mousemove((e) => {
        var centerX = $(window).scrollLeft() + $(window).width() / 2;
        var centerY = $(window).scrollTop() + $(window).height() / 2;
        var theta = Math.atan2(e.clientY - centerY, e.clientX - centerX); 

        this.position.theta = theta;
    });

};

PredatorsCore.prototype.clientUpdate = function() {
    console.log(this.position.theta);
}


PredatorsCore.prototype.update = function() {
    this.clientUpdate();
    requestAnimationFrame(this.update.bind(this));
}

if( 'undefined' != typeof global ) {
    module.exports = global.PredatorsCore = PredatorsCore;
}
