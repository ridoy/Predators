var assert = require('assert');
var maps   = require('../maps/maps.js');
var core   = require('../public/js/core.js');

describe('PredatorsCore', function() {
    describe('#setMap()', function() {
        it('should set map to be 2d array', function() {
            var core = new PredatorsCore();
            core.setMap(maps.map1);
            assert.ok(core.map);
            assert.ok(core.map[0]);
            assert.ok(Number.isInteger(core.map[0][0]));
        });
    });
    describe('#setMap()', function() {
        it('should set mapHeight and mapWidth according to map dimensions', function() {
            var core = new PredatorsCore();
            core.setMap(maps.map1);
            assert.equal(core.mapHeight, maps.map1.length);
            assert.equal(core.mapWidth, maps.map1[0].length);
        });
    });
    describe('#clientConnect()', function() {
        it('should set mapHeight and mapWidth according to map dimensions', function() {
            var core = new PredatorsCore();
            core.setMap(maps.map1);
            assert.equal(core.mapHeight, maps.map1.length);
            assert.equal(core.mapWidth, maps.map1[0].length);
        });
    });
});

