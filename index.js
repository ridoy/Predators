/*
 * PREDATORS
 * Online Multiplayer Game
 *
 * app.js
 *
 * AUTHORS
 * Ridoy Majumdar (https://github.com/ridoymajumdar)
 * Matthew Violet (https://github.com/mattviolet)
 * Jake Vollkommer (https://github.com/jakevollkommer)
 */

// Imports
var express = require('express'),
    app     = express(),
    request = require('request'),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    uuid    = require('node-uuid'),
    path    = require('path'),
    config  = require('./config/config.js'),
    core    = require('./public/js/core.js'),
    maps    = require('./maps/maps.js');

app.use(express.static('public'));

// Server settings
// Adjust these to your preference in config/config.js
var port       = config.port;
    maxPlayers = config.maxPlayers; 

http.listen(port, function() {
  console.log('Listening on ' + port)
})

// Instantiate the game core and map
var game = new PredatorsCore();
game.setMap(maps.map2);

// Multiplayer logic
io.on('connection', function(client) {

    // Generate unique ID for this client
    client.id = uuid.v1();

    game.players.push({
        id: client.id,
        x: 100,
        y: 100,
        xVelocity: 0,
        yVelocity: 0,
        keysDown: {},
        score: 0
    });

    console.log('New friend connected!\nPlayers online:\n' + game.players);

    // Send this player their id and a list of players
    client.emit('connected', {
        id: client.id,
        map: game.map,
        players: game.players,
        coins: game.coins
    });

    // Handle keysDown updates from this player
    client.on('clientStateUpdate', function(msg) {
        var player = game.findPlayer(msg.id);
        if (player) {
            player.keysDown = msg.keysDown;
        }
    });

    // Handle when a player catches a coin
    client.on('coinCaughtEvent', function(msg) {
        var player = game.findPlayer(msg.id);
        if (player) {
            game.removeCoin(msg.coin);
            player.score += 1;
            console.log(player.score);
        }
    });

    // Remove this player from game when disconnected
    client.on('disconnect', function() {
        for (var i = 0; i < game.players.length; i++) {
            if (game.players[i].id === client.id) {
                game.players.splice(i, 1);
                console.log('A player disconnected :(\nPlayers online:\n' + game.players);
                return;
            }
        }
    });

    function sendUpdateToClient() {
        client.emit('serverUpdate', {
            players: game.players,
            coins:   game.coins,
            time:    Number(new Date().getTime())
        });
    }


    // Send out server's record of positions every 45ms
    setInterval(sendUpdateToClient, 45);
})


/*
 * Calculate physics of one tick for all players in this game
 * params: none
 * return: none
 */
var updatePlayerPositions = function() {
    game.players = game.players.map(function(player) {
        game.updatePlayerPosition(player);

        return player;
    });
};

var updateCoins = function() {
    if (game.coins.length === 0) {
        for (var i = 0; i < game.numCoins; i++) {
            game.generateCoin();
        }
    } else if (game.coins.length < game.numCoins) {
        game.generateCoin();
    }
};

// Update all player positions every 15ms
setInterval(updatePlayerPositions, 15);

setInterval(updateCoins, 15);

// Ping the main server.
// This allows your server to be listed on the list of all avaiable servers.
var options = {
    url: config.mainPredatorsHost + '/serverlist',
    method: 'POST',
    followAllRedirects: true,
    form: { 
        url: config.thisHost,
        name: config.serverName,
        playerCount: game.players.length, 
        maxPlayers: maxPlayers 
    }
};

request(options, function(err, res, body) {
    if (err) { 
        console.log('There was an error reaching the server list on http://predators.io :(\n' + err);
        return;
    }
    console.log('Reached main server at http://predators.io/. Your server has been added to the main server list on http://predators.io.');
});

// After initial request to main server, the main server will periodically check on the server at this route.
// We send back the current number of players online.
app.get('/serverinfo', function(req, res) {
    res.send({ 
        playerCount: game.players.length,
    });
});
