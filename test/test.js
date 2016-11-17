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
            // Player spawns in sky and drops until on ground
            var player = core.generateNewPlayer();

            while (!player.isOnGround) {
                core.updatePlayerPosition(player);
            }

            var rowBelow  = 1 + getRowFromY(player.y);
            var expectedY = (rowBelow * core.scaleFactor) - core.playerRadius;

            assert.equal(expectedY, player.y)
        });

        it('yVelocity should be 0 if on ground', () => {
            // Player spawns in sky and drops until on ground
            var player = core.generateNewPlayer();

            while (!player.isOnGround) {
                core.updatePlayerPosition(player);
            }

            // Update one more time
            core.updatePlayerPosition(player);

            assert.equal(player.yVelocity, 0);
        });

    });

    function getColFromX(x) {
        return Math.floor(x / core.scaleFactor);
    }

    function getRowFromY(y) {
        return Math.floor(y / core.scaleFactor);
    }
});

