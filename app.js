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
    config  = require('./config/config.js');
    core    = require('./public/core/predators.js');

// Server settings.
// Adjust these to your preference in config/config.js
var port       = config.port;
    maxPlayers = config.maxPlayers; 

var game = new PredatorsCore();

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile('index.html');
});

app.get('/serverinfo', function(req, res) {
    var data = { 
        url: config.thisHost,
        name: config.serverName,
        playerCount: game.players.length, 
        maxPlayers: maxPlayers 
    };
    res.send(data);
});

http.listen(port, function() {
  console.log('Listening on ' + port)
})

io.on('connection', function(client) {

    // Generate unique ID for this client
    client.id = uuid.v1();

    game.players.push({
        id: client.id,
        x: 0,
        y: 0,
        keysDown: {}
    });

    console.log('New friend connected!');
    console.log('Players online:');
    console.log(game.players);

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
            players: game.players,
            time:    Date.now()
        });
    }

    setInterval(updateAllClients, 45);
})

// TODO move this to core?
function clientPhysicsUpdate() {
    game.players = game.players.map(function(player) {
        var x = player.x;
        var y = player.y;

        if (player.keysDown.right) x += 1;
        if (player.keysDown.left)  x -= 1;
        if (player.keysDown.up)    y -= 1;
        if (player.keysDown.down)  y += 1;

        if (game.isWithinBoundaries(x, y)) {
            player.x = x;
            player.y = y;
        }

        return player;
    });
}

setInterval(clientPhysicsUpdate, 15);

// Ping the main server.
// This allows your server to be listed on the list of all avaiable servers.
var postData = { 
    url: config.thisHost,
    name: config.serverName,
    playerCount: game.players.length, 
    maxPlayers: maxPlayers 
};

request.post(config.mainPredatorsHost + '/serverlist', { form: postData }, function(err, res, body) {
    if (err) { console.log(err); return; }
});
