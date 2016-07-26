/*
 * PREDATORS
 * Online Multiplayer Game
 *
 * AUTHORS
 * Ridoy Majumdar (https://github.com/ridoymajumdar)
 * Matthew Violet (https://github.com/mattviolet)
 * Jake Vollkommer (https://github.com/jakevollkommer)
 */

var app     = require('express')(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    uuid    = require('node-uuid'),
    port    = process.env.PREDATORS_PORT || 3000; // Configure port

app.get('/', function(req,res) {
  res.sendFile('index.html');
});

io.on('connection', function(client) {
  console.log('New friend connected!');

  // Generate unique ID for this client
  client.id = uuid.v1();

  // Let this client know their ID
  client.emit('onconnected', {
    id: client.id
  });

});

http.listen(port, function() {
  console.log('Listening on port ' + port);
});
