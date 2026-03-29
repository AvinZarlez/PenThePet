/**
 * Unit Tests for constants.js
 *
 * Tests the CONSTANTS object structure and values.
 */

const CONSTANTS = require('../../../js/config/constants.js');

describe('CONSTANTS', () => {
    describe('Structure', () => {
        test('should be an object', () => {
            expect(typeof CONSTANTS).toBe('object');
            expect(CONSTANTS).not.toBeNull();
        });

        test('should have all required top-level properties', () => {
            expect(CONSTANTS).toHaveProperty('MAX_WALLS');
            expect(CONSTANTS).toHaveProperty('MAX_GRID_SIZE');
            expect(CONSTANTS).toHaveProperty('MIN_GRID_SIZE');
            expect(CONSTANTS).toHaveProperty('DEFAULT_GRID_SIZE');
            expect(CONSTANTS).toHaveProperty('MAX_GENERATION_ATTEMPTS');
            expect(CONSTANTS).toHaveProperty('TILE_DISTRIBUTION');
            expect(CONSTANTS).toHaveProperty('CELL');
            expect(CONSTANTS).toHaveProperty('GRID_PADDING');
            expect(CONSTANTS).toHaveProperty('ALLOW_WALL_REMOVAL');
            expect(CONSTANTS).toHaveProperty('AUTO_SAVE_STATE');
            expect(CONSTANTS).toHaveProperty('HINTS_DISABLED_DEFAULT');
            expect(CONSTANTS).toHaveProperty('HINTS_NEVER_SHOW_TARGET_DEFAULT');
        });
    });

    describe('Wall Configuration', () => {
        test('MAX_WALLS should be a positive number', () => {
            expect(typeof CONSTANTS.MAX_WALLS).toBe('number');
            expect(CONSTANTS.MAX_WALLS).toBeGreaterThan(0);
        });

        test('MAX_WALLS should be reasonable (1-50)', () => {
            expect(CONSTANTS.MAX_WALLS).toBeGreaterThanOrEqual(1);
            expect(CONSTANTS.MAX_WALLS).toBeLessThanOrEqual(50);
        });
    });

    describe('Grid Configuration', () => {
        test('MAX_GRID_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.MAX_GRID_SIZE).toBe('number');
            expect(CONSTANTS.MAX_GRID_SIZE).toBeGreaterThan(0);
        });

        test('MIN_GRID_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.MIN_GRID_SIZE).toBe('number');
            expect(CONSTANTS.MIN_GRID_SIZE).toBeGreaterThan(0);
        });

        test('DEFAULT_GRID_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.DEFAULT_GRID_SIZE).toBe('number');
            expect(CONSTANTS.DEFAULT_GRID_SIZE).toBeGreaterThan(0);
        });

        test('MIN_GRID_SIZE should be less than or equal to DEFAULT_GRID_SIZE', () => {
            expect(CONSTANTS.MIN_GRID_SIZE).toBeLessThanOrEqual(CONSTANTS.DEFAULT_GRID_SIZE);
        });

        test('DEFAULT_GRID_SIZE should be less than or equal to MAX_GRID_SIZE', () => {
            expect(CONSTANTS.DEFAULT_GRID_SIZE).toBeLessThanOrEqual(CONSTANTS.MAX_GRID_SIZE);
        });

        test('MIN_GRID_SIZE should be less than MAX_GRID_SIZE', () => {
            expect(CONSTANTS.MIN_GRID_SIZE).toBeLessThan(CONSTANTS.MAX_GRID_SIZE);
        });

        test('Grid sizes should be odd numbers (for centered home)', () => {
            expect(CONSTANTS.MIN_GRID_SIZE % 2).toBe(1);
            expect(CONSTANTS.DEFAULT_GRID_SIZE % 2).toBe(1);
            expect(CONSTANTS.MAX_GRID_SIZE % 2).toBe(1);
        });
    });

    describe('Map Generation', () => {
        test('MAX_GENERATION_ATTEMPTS should be a positive number', () => {
            expect(typeof CONSTANTS.MAX_GENERATION_ATTEMPTS).toBe('number');
            expect(CONSTANTS.MAX_GENERATION_ATTEMPTS).toBeGreaterThan(0);
        });

        test('MAX_GENERATION_ATTEMPTS should be reasonable (10-1000)', () => {
            expect(CONSTANTS.MAX_GENERATION_ATTEMPTS).toBeGreaterThanOrEqual(10);
            expect(CONSTANTS.MAX_GENERATION_ATTEMPTS).toBeLessThanOrEqual(1000);
        });
    });

    describe('Tile Distribution', () => {
        test('TILE_DISTRIBUTION should be an object', () => {
            expect(typeof CONSTANTS.TILE_DISTRIBUTION).toBe('object');
            expect(CONSTANTS.TILE_DISTRIBUTION).not.toBeNull();
        });

        test('TILE_DISTRIBUTION should have grass property', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION).toHaveProperty('grass');
            expect(typeof CONSTANTS.TILE_DISTRIBUTION.grass).toBe('number');
        });

        test('TILE_DISTRIBUTION should have water property', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION).toHaveProperty('water');
            expect(typeof CONSTANTS.TILE_DISTRIBUTION.water).toBe('number');
        });

        test('grass probability should be between 0 and 1', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION.grass).toBeGreaterThanOrEqual(0);
            expect(CONSTANTS.TILE_DISTRIBUTION.grass).toBeLessThanOrEqual(1);
        });

        test('water probability should be between 0 and 1', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION.water).toBeGreaterThanOrEqual(0);
            expect(CONSTANTS.TILE_DISTRIBUTION.water).toBeLessThanOrEqual(1);
        });

        test('probabilities should sum to 1', () => {
            const sum = CONSTANTS.TILE_DISTRIBUTION.grass + CONSTANTS.TILE_DISTRIBUTION.water;
            expect(sum).toBeCloseTo(1.0, 5);
        });
    });

    describe('Cell Configuration', () => {
        test('CELL should be an object', () => {
            expect(typeof CONSTANTS.CELL).toBe('object');
            expect(CONSTANTS.CELL).not.toBeNull();
        });

        test('CELL.GAP should be a non-negative number', () => {
            expect(typeof CONSTANTS.CELL.GAP).toBe('number');
            expect(CONSTANTS.CELL.GAP).toBeGreaterThanOrEqual(0);
        });

        test('CELL.GAP_SMALL should be a non-negative number less than CELL.GAP', () => {
            expect(typeof CONSTANTS.CELL.GAP_SMALL).toBe('number');
            expect(CONSTANTS.CELL.GAP_SMALL).toBeGreaterThanOrEqual(0);
            expect(CONSTANTS.CELL.GAP_SMALL).toBeLessThan(CONSTANTS.CELL.GAP);
        });

        test('CELL.GAP_BREAKPOINT should be a positive number', () => {
            expect(typeof CONSTANTS.CELL.GAP_BREAKPOINT).toBe('number');
            expect(CONSTANTS.CELL.GAP_BREAKPOINT).toBeGreaterThan(0);
        });

        test('CELL.MIN_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.CELL.MIN_SIZE).toBe('number');
            expect(CONSTANTS.CELL.MIN_SIZE).toBeGreaterThan(0);
        });

        test('CELL.MAX_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.CELL.MAX_SIZE).toBe('number');
            expect(CONSTANTS.CELL.MAX_SIZE).toBeGreaterThan(0);
        });

        test('CELL.MIN_SIZE should be less than CELL.MAX_SIZE', () => {
            expect(CONSTANTS.CELL.MIN_SIZE).toBeLessThan(CONSTANTS.CELL.MAX_SIZE);
        });
    });

    describe('Grid Sizing', () => {
        test('GRID_PADDING should be a non-negative number', () => {
            expect(typeof CONSTANTS.GRID_PADDING).toBe('number');
            expect(CONSTANTS.GRID_PADDING).toBeGreaterThanOrEqual(0);
        });

    });

    describe('Gameplay Settings', () => {
        test('ALLOW_WALL_REMOVAL should be a boolean', () => {
            expect(typeof CONSTANTS.ALLOW_WALL_REMOVAL).toBe('boolean');
        });

        test('AUTO_SAVE_STATE should be a boolean', () => {
            expect(typeof CONSTANTS.AUTO_SAVE_STATE).toBe('boolean');
        });
    });

    describe('Hints Configuration', () => {
        test('HINTS_DISABLED_DEFAULT should be a boolean', () => {
            expect(typeof CONSTANTS.HINTS_DISABLED_DEFAULT).toBe('boolean');
        });

        test('HINTS_NEVER_SHOW_TARGET_DEFAULT should be a boolean', () => {
            expect(typeof CONSTANTS.HINTS_NEVER_SHOW_TARGET_DEFAULT).toBe('boolean');
        });
    });

    describe('Tile Data Integration', () => {
        test('TILE_DATA should define score for star tiles', () => {
            expect(typeof TILE_DATA.star.score).toBe('number');
            expect(TILE_DATA.star.score).toBe(3);
        });

        test('TILE_DATA should define score for grass tiles', () => {
            expect(TILE_DATA.grass.score).toBe(1);
        });

        test('all tiles should have required properties', () => {
            for (const [, data] of Object.entries(TILE_DATA)) {
                expect(data).toHaveProperty('score');
                expect(data).toHaveProperty('wallPlaceable');
                expect(data).toHaveProperty('chance');
                expect(data).toHaveProperty('compactChar');
                expect(data).toHaveProperty('numericId');
                expect(data).toHaveProperty('assets');
            }
        });

        test('enclosedAssets should fall back to assets when not defined', () => {
            expect(getTileAssets('water', true)).toEqual(['water-1.svg', 'water-2.svg', 'water-3.svg', 'water-4.svg']);
            expect(getTileAssets('wall', true)).toEqual(['wall.png']);
        });

        test('enclosedAssets should override assets when tile is enclosed', () => {
            // grass: penned state handled by TileSvgs recolouring; no enclosedAssets defined
            expect(getTileAssets('grass', true)).toEqual(['grass-1.svg', 'grass-2.svg', 'grass-3.svg', 'grass-4.svg']);
            // home/star/bee: enclosedAssets are just the icon overlays (TileSvgs handles the background)
            expect(getTileAssets('star', true)).toEqual(['star-outline.svg', 'star.svg']);
            expect(getTileAssets('home', true)).toEqual(['home.png']);
        });

        test('getTileAssets returns normal assets when not enclosed', () => {
            expect(getTileAssets('grass', false)).toEqual(['grass-1.svg', 'grass-2.svg', 'grass-3.svg', 'grass-4.svg']);
            expect(getTileAssets('home', false)).toEqual(['home.png']);
            expect(getTileAssets('star', false)).toEqual(['star-outline.svg', 'star.svg']);
        });

        test('getTileAssets falls back to grass.svg for unknown tile', () => {
            expect(getTileAssets('nonexistent', false)).toEqual(['grass.svg']);
        });

        test('grass tile has baseLayer defined', () => {
            expect(TILE_DATA.grass.baseLayer).toBe('grass-base.svg');
        });

        test('water tile has baseLayer defined', () => {
            expect(TILE_DATA.water.baseLayer).toBe('water-base.svg');
        });

        test('getTileBaseLayer returns baseLayer for grass and water', () => {
            expect(getTileBaseLayer('grass')).toBe('grass-base.svg');
            expect(getTileBaseLayer('water')).toBe('water-base.svg');
        });

        test('getTileBaseLayer returns null for tiles without a baseLayer', () => {
            expect(getTileBaseLayer('wall')).toBeNull();
            expect(getTileBaseLayer('home')).toBeNull();
            expect(getTileBaseLayer('star')).toBeNull();
            expect(getTileBaseLayer('nonexistent')).toBeNull();
        });

        test('getTileBackgroundGroup returns grass for home, star, bee', () => {
            expect(getTileBackgroundGroup('home')).toBe('grass');
            expect(getTileBackgroundGroup('star')).toBe('grass');
            expect(getTileBackgroundGroup('bee')).toBe('grass');
        });

        test('getTileBackgroundGroup returns null for tiles without backgroundGroup', () => {
            expect(getTileBackgroundGroup('grass')).toBeNull();
            expect(getTileBackgroundGroup('water')).toBeNull();
            expect(getTileBackgroundGroup('wall')).toBeNull();
            expect(getTileBackgroundGroup('nonexistent')).toBeNull();
        });

        test('grass assets list contains 4 variant SVGs', () => {
            expect(TILE_DATA.grass.assets).toHaveLength(4);
            for (let i = 1; i <= 4; i++) {
                expect(TILE_DATA.grass.assets).toContain(`grass-${i}.svg`);
            }
        });

        test('water assets list contains 4 variant SVGs', () => {
            expect(TILE_DATA.water.assets).toHaveLength(4);
            for (let i = 1; i <= 4; i++) {
                expect(TILE_DATA.water.assets).toContain(`water-${i}.svg`);
            }
        });

        test('getPawOverlay returns default paw.svg for undefined pawOverlay', () => {
            expect(getPawOverlay('grass')).toEqual(['paw.svg']);
            expect(getPawOverlay('star')).toEqual(['paw.svg']);
        });

        test('getPawOverlay returns empty array for tiles with pawOverlay: []', () => {
            expect(getPawOverlay('home')).toEqual([]);
            expect(getPawOverlay('water')).toEqual([]);
            expect(getPawOverlay('wall')).toEqual([]);
        });

        test('getPawOverlay returns default for unknown tile', () => {
            expect(getPawOverlay('nonexistent')).toEqual(['paw.svg']);
        });

        test('home tile uses TileSvgs for background (backgroundGroup set, no grass-base asset)', () => {
            expect(TILE_DATA.home.backgroundGroup).toBe('grass');
            expect(TILE_DATA.home.assets[0]).toBe('home.png');
        });

        test('star tile uses TileSvgs for background (backgroundGroup set, no grass-base asset)', () => {
            expect(TILE_DATA.star.backgroundGroup).toBe('grass');
            expect(TILE_DATA.star.assets[0]).toBe('star-outline.svg');
            expect(TILE_DATA.star.assets[1]).toBe('star.svg');
        });
    });

    describe('Value Reasonableness', () => {
        test('all numeric values should be finite', () => {
            expect(Number.isFinite(CONSTANTS.MAX_WALLS)).toBe(true);
            expect(Number.isFinite(CONSTANTS.MAX_GRID_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.MIN_GRID_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.DEFAULT_GRID_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.MAX_GENERATION_ATTEMPTS)).toBe(true);
            expect(Number.isFinite(CONSTANTS.CELL.GAP)).toBe(true);
            expect(Number.isFinite(CONSTANTS.CELL.MIN_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.CELL.MAX_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.GRID_PADDING)).toBe(true);

        });

        test('all numeric values should not be NaN', () => {
            expect(Number.isNaN(CONSTANTS.MAX_WALLS)).toBe(false);
            expect(Number.isNaN(CONSTANTS.MAX_GRID_SIZE)).toBe(false);
            expect(Number.isNaN(CONSTANTS.MIN_GRID_SIZE)).toBe(false);
            expect(Number.isNaN(CONSTANTS.DEFAULT_GRID_SIZE)).toBe(false);
            expect(Number.isNaN(CONSTANTS.MAX_GENERATION_ATTEMPTS)).toBe(false);
        });
    });

    describe('REPO_URL', () => {
        test('should be defined', () => {
            expect(CONSTANTS).toHaveProperty('REPO_URL');
        });

        test('should be a non-empty string', () => {
            expect(typeof CONSTANTS.REPO_URL).toBe('string');
            expect(CONSTANTS.REPO_URL.length).toBeGreaterThan(0);
        });

        test('should be a valid GitHub repository URL', () => {
            expect(CONSTANTS.REPO_URL).toMatch(/^https:\/\/github\.com\//);
        });
    });

    describe('Tile Data Helper Functions', () => {
        test('isFillableTile should return true for hole', () => {
            expect(isFillableTile('hole')).toBe(true);
        });

        test('isFillableTile should return false for grass', () => {
            expect(isFillableTile('grass')).toBe(false);
        });

        test('isFillableTile should return false for water (blocks but not wall-placeable)', () => {
            expect(isFillableTile('water')).toBe(false);
        });

        test('isFillableNumericId should return true for hole numericId', () => {
            expect(isFillableNumericId(TILE_DATA.hole.numericId)).toBe(true);
        });

        test('isFillableNumericId should return false for grass numericId', () => {
            expect(isFillableNumericId(TILE_DATA.grass.numericId)).toBe(false);
        });

        test('isWallState should return true for wall', () => {
            expect(isWallState('wall')).toBe(true);
        });

        test('isWallState should return true for filledHole', () => {
            expect(isWallState('filledHole')).toBe(true);
        });

        test('isWallState should return false for grass', () => {
            expect(isWallState('grass')).toBe(false);
        });

        test('isWallState should return false for unknown tile', () => {
            expect(isWallState('unknown')).toBe(false);
        });

        test('getWallTransform should return filledHole for hole', () => {
            expect(getWallTransform('hole')).toBe('filledHole');
        });

        test('getWallTransform should return wall for grass', () => {
            expect(getWallTransform('grass')).toBe('wall');
        });

        test('getWallTransform should return wall for unknown tile', () => {
            expect(getWallTransform('unknown')).toBe('wall');
        });

        test('FILLABLE_TILES should contain hole', () => {
            expect(FILLABLE_TILES.has('hole')).toBe(true);
        });

        test('FILLABLE_TILES should not contain grass or water', () => {
            expect(FILLABLE_TILES.has('grass')).toBe(false);
            expect(FILLABLE_TILES.has('water')).toBe(false);
        });

        test('FILLED_SCORE_MAP should map hole numericId to filledHole score', () => {
            expect(FILLED_SCORE_MAP[TILE_DATA.hole.numericId]).toBe(TILE_DATA.filledHole.score);
        });

        test('hole tile should have correct properties', () => {
            expect(TILE_DATA.hole.score).toBe(0);
            expect(TILE_DATA.hole.wallPlaceable).toBe(true);
            expect(TILE_DATA.hole.blocksMovement).toBe(true);
            expect(TILE_DATA.hole.chance).toBe(0);
            expect(TILE_DATA.hole.wallTransformsTo).toBe('filledHole');
        });

        test('filledHole tile should have correct properties', () => {
            expect(TILE_DATA.filledHole.score).toBe(1);
            expect(TILE_DATA.filledHole.wallPlaceable).toBe(false);
            expect(TILE_DATA.filledHole.blocksMovement).toBe(false);
            expect(TILE_DATA.filledHole.wallState).toBe(true);
            expect(TILE_DATA.filledHole.chance).toBe(0);
        });
    });
});

// ---------------------------------------------------------------------------
// TileData utility function branch coverage
// ---------------------------------------------------------------------------
describe('tileData utility functions — edge cases', () => {
    test('getNumericTileScore returns 0 for an unknown numeric ID', () => {
        // This covers the `: 0` branch in NUMERIC_ID_TO_SCORE[numericId] !== undefined check
        expect(getNumericTileScore(-999)).toBe(0);
        expect(getNumericTileScore(99999)).toBe(0);
    });

    test('isTileClickable returns false for an unknown tile name', () => {
        // This covers the `data ? data.clickable : false` — false branch
        expect(isTileClickable('nonexistent_tile_xyz')).toBe(false);
    });

    test('getTileScore returns 0 for an unknown tile name', () => {
        // Covers the `data ? data.score : 0` — false branch
        expect(getTileScore('unknown_tile_xyz')).toBe(0);
    });

    test('isBlockingTile returns false for a non-blocking tile name', () => {
        expect(isBlockingTile('grass')).toBe(false);
    });

    test('isBlockingTile returns true for a blocking tile (water)', () => {
        expect(isBlockingTile('water')).toBe(true);
    });
});
