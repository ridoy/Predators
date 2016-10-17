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

// TODO implement max_users

var express = require('express'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    uuid    = require('node-uuid'),
    path    = require('path'),
    core    = require('./public/core/predators.js');
    port    = process.env.PREDATORS_PORT || 4000; // Configure port

var game = new PredatorsCore();

app.use(express.static('public'));

io.on('connection', function(client) {
    console.log('New friend connected!');

    // Generate unique ID for this client
    client.id = uuid.v1();

    game.players.push({
        id: client.id,
        x: 0,
        y: 0,
        keysDown: {}
    });

    // Send this player their id and a list of players
    client.emit('connected', {
        id: client.id,
        players: game.players
    });

    client.on('clientStateUpdate', function(msg) {
        var player = game.findPlayer(msg.id);
        if (player) {
            player.keysDown = msg.keysDown;
        }
    });

    client.on('disconnect', function() {
        for (var i = 0; i < game.players.length; i++) {
            if (game.players[i].id === client.id) {
                game.players.splice(i, 1);
                return;
            }
        }
    });

    function updateAllClients() {
        client.emit('serverUpdate', {
            players: game.players
        });
    }

    setInterval(updateAllClients, 100);
})

// TODO move this to core?
function clientPhysicsUpdate() {
    // how do i do this computation in parallel? Prob negligible difference that I *can* take into account anyway
    game.players = game.players.map(function(player) {
        var x = player.x;
        var y = player.y;

        if (player.keysDown.right) x += 1;
        if (player.keysDown.left)  x -= 1;
        if (player.keysDown.up)    y -= 1;
        if (player.keysDown.down)  y += 1;

        player.x = x;
        player.y = y;

        return player;
    });
    console.log(game.players);
}

setInterval(clientPhysicsUpdate, 16);

http.listen(port, function() {
  console.log('Listening on ' + port)
})
