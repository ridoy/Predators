/*
 * PREDATORS
 * Online Multiplayer Game
 *
 * AUTHORS
 * Ridoy Majumdar (https://github.com/ridoymajumdar)
 * Matthew Violet (https://github.com/mattviolet)
 * Jake Vollkommer (https://github.com/jakevollkommer)
 */

var express = require('express'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    uuid    = require('node-uuid'),
    path    = require('path'),
    port    = process.env.PREDATORS_PORT || 4000; // Configure port

app.use(express.static('public'));

io.on('connection', (client) => {
  console.log('New friend connected!');

  // Generate unique ID for this client
  client.id = uuid.v1();

  // Let this client know their ID
  client.emit('onconnected', {
    id: client.id
  });

  client.on('test', (obj) => {
    console.log(JSON.stringify(obj));
  })

})

http.listen(port, () => {
  console.log('Listening on ' + port)
})
