var assert = require('assert');
var maps   = require('../maps/maps.js');
var core   = require('../public/js/core.js');

/*
 * What are you testing?
 * What should it do?
 * What's the actual output?
 * What's the expected output?
 * How can the test be reproduced?
 */

describe('PredatorsCore', () => {
    var core = new PredatorsCore();
    core.setMap(maps.map1);
    describe('#setMap()', () => {
        it('should set map to be 2d array', () => {
            assert.ok(core.map);
            assert.ok(core.map[0]);
            assert.ok(Number.isInteger(core.map[0][0]));
        });

        it('should set mapHeight and mapWidth according to map dimensions', () => {
            assert.equal(core.mapHeight, maps.map1.length);
            assert.equal(core.mapWidth, maps.map1[0].length);
        });
    });

    describe('#updatePlayerPosition()', () => {
        it('should land player directly on ground surface', () => {
            // Player spawns in sky
            var player = core.generateNewPlayer();
            dropPlayerToGround(player);

            var groundRow = 1 + getRowFromY(player.y); // Add 1 to get row below player
            var expectedY = (groundRow * core.scaleFactor) - core.playerRadius;

            assert.equal(expectedY, player.y)
        });

        it('yVelocity should be 0 if on ground', () => {
            // Player spawns in sky
            var player = core.generateNewPlayer();
            dropPlayerToGround(player);

            // Update one more time
            core.updatePlayerPosition(player);

            assert.equal(player.yVelocity, 0);
        });
    });

    describe('#calculateYAfterOneTick()', () => {
        it('player should not be able to jump (yVelocity > 0) while in air', () => {
            // Player spawns in sky
            var player = core.generateNewPlayer();
            player.keysDown.up = true;

            // Run one tick -- player should still be in sky after this
            core.updatePlayerPosition(player);

            // If this errors, it means the player does not spawn high enough
            assert.equal(player.isOnGround, false);

            // Is the player jumping?
            assert.equal(player.yVelocity > 0, false);
        });
    });

    describe('#interpolateOtherUsers()', () => {
        // Describe what should happen for interpolation
        // Write tests to discover failures that crop up in operation
        // Base tests on what the system has to do
        //
    });

    function dropPlayerToGround(player) {
        while (!player.isOnGround) {
            core.updatePlayerPosition(player);
        }
    }

    function getColFromX(x) {
        return Math.floor(x / core.scaleFactor);
    }

    function getRowFromY(y) {
        return Math.floor(y / core.scaleFactor);
    }
});

