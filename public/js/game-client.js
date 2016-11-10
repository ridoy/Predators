/*
 * PREDATORS
 * Online Multiplayer Game
 *
 * game-client.js
 *
 * AUTHORS
 * Ridoy Majumdar (https://github.com/ridoymajumdar)
 * Matthew Violet (https://github.com/mattviolet)
 * Jake Vollkommer (https://github.com/jakevollkommer)
 */

window.onload = function() {
  var game = new PredatorsCore();
  console.log(game);
  game.clientConnect();
};

