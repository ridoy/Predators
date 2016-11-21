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

    describe('#setMap()', () => {
        it('should set map to be 2d array', () => {
            core.setMap(maps.map1);
            assert.ok(core.map);
            assert.ok(core.map[0]);
            assert.ok(Number.isInteger(core.map[0][0]));
        });

        it('should set mapHeight and mapWidth according to map dimensions', () => {
            core.setMap(maps.map1);
            assert.equal(core.mapHeight, maps.map1.length);
            assert.equal(core.mapWidth, maps.map1[0].length);
        });
    });

    core.setMap(maps.map2);

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

    describe('#calculateXAfterOneTick()', () => {
        it('should block player from going into a wall (player moving right into wall)', () => {
            core.setMap(maps.map2); // map2 has a hole which players fall into when they spawn

            var player = core.generateNewPlayer();
            dropPlayerToGround(player);

            // Goal: Move right and at some point the player won't be able to move right anymore
            // (because the player collides with the wall)
            player.keysDown.right = true;

            var row          = getRowFromY(player.y);
            var colToRight   = 1 + getColFromX(player.x);
            var blockToRight = core.map[row][colToRight];
            while (blockToRight !== 1) {
                core.updatePlayerPosition(player);
                colToRight   = 1 + getColFromX(player.x);
                blockToRight = core.map[row][colToRight];
            }

            var currentCol = getColFromX(player.x);
            // Attempt to move right (10 times for good measure). Player should still be in same column
            for (var i = 0; i < 10; i++) {
                core.updatePlayerPosition(player);
            }

            assert.equal(currentCol, getColFromX(player.x));
        });

        it('should block player from going into a wall (player moving left into wall)', () => {
            core.setMap(maps.map2); // map2 has a hole which players fall into when they spawn

            var player = core.generateNewPlayer();
            dropPlayerToGround(player);

            // Goal: Move left and at some point the player won't be able to move left anymore
            // (because the player collides with the wall)
            player.keysDown.left = true;

            var row          = getRowFromY(player.y);
            var colToLeft    = getColFromX(player.x) - 1;
            var blockToLeft  = core.map[row][colToLeft];
            while (blockToLeft !== 1) {
                core.updatePlayerPosition(player);
                colToLeft   = getColFromX(player.x) - 1;
                blockToLeft = core.map[row][colToLeft];
            }

            var currentCol = getColFromX(player.x);
            // Attempt to move left (10 times for good measure). Player should still be in same column
            for (var i = 0; i < 10; i++) {
                core.updatePlayerPosition(player);
            }

            assert.equal(currentCol, getColFromX(player.x));
        });
    });

    describe('#calculateYAfterOneTick()', () => {
        it('player should not be able to jump (yVelocity > 0) while in air', () => {
            // Player spawns in sky
            var player = core.generateNewPlayer();

            // Click jumping key
            player.keysDown.up = true;

            // Calculate one tick in time -- player should still be in sky after this
            core.updatePlayerPosition(player);

            // If this errors, it means the player does not spawn high enough
            assert.equal(player.isOnGround, false);

            // Is the player jumping?
            assert.equal(player.yVelocity > 0, false);
        });

        it('should drop player if space below is empty', () => {
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
