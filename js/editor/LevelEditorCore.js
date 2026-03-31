/**
 * LevelEditorCore
 *
 * Shared state + validation logic for the local level editor UI.
 * Keeps browser-side editing behavior testable and centralized.
 */

class LevelEditorCore {
    /**
     * @param {Object} options
     * @param {number} options.size
     * @param {string} options.levelName
     */
    constructor(options = {}) {
        const defaultSize = CONSTANTS.DEFAULT_GRID_SIZE;
        const minSize = CONSTANTS.MIN_GRID_SIZE;
        const maxSize = CONSTANTS.MAX_GRID_SIZE;
        const initialSize = options.size || defaultSize;
        if (initialSize < minSize || initialSize > maxSize) {
            throw new Error(`Invalid editor size ${initialSize}`);
        }

        this.size = initialSize;
        this.levelName = options.levelName || CONSTANTS.LEVEL_EDITOR.DEFAULT_LEVEL_NAME;
        this.selectedTile = LevelEditorCore.DEFAULT_SELECTED_TILE;
        this.solvedResult = null;
        this.map = this._createBlankMap(this.size);
    }

    _createBlankMap(size) {
        return Array.from({ length: size }, () => Array(size).fill('grass'));
    }

    reset(size = this.size) {
        this.size = size;
        this.map = this._createBlankMap(size);
        this.solvedResult = null;
        this.selectedTile = LevelEditorCore.DEFAULT_SELECTED_TILE;
    }

    setLevelName(name) {
        this.levelName = (name || '').trim();
    }

    setSelectedTile(tileName) {
        if (!LevelEditorCore.EDITABLE_TILE_OPTIONS.includes(tileName)) {
            throw new Error(`Unsupported editor tile: ${tileName}`);
        }
        this.selectedTile = tileName;
    }

    setMapSize(size) {
        const minSize = CONSTANTS.MIN_GRID_SIZE;
        const maxSize = CONSTANTS.MAX_GRID_SIZE;
        if (size < minSize || size > maxSize) {
            throw new Error(`Map size must be between ${minSize} and ${maxSize}`);
        }
        this.reset(size);
    }

    placeTile(row, col) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size) return;
        const tile = this.selectedTile;
        if (tile === 'home') {
            this._removeExistingHome();
        }
        this.map[row][col] = tile;
        this.invalidateSolvedState();
    }

    eraseTile(row, col) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size) return;
        this.map[row][col] = LevelEditorCore.ERASE_TILE;
        this.invalidateSolvedState();
    }

    _removeExistingHome() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.map[r][c] === 'home') {
                    this.map[r][c] = 'grass';
                }
            }
        }
    }

    ensureSingleHome() {
        const homePositions = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.map[r][c] === 'home') homePositions.push([r, c]);
            }
        }
        if (homePositions.length <= 1) return;
        const [keepR, keepC] = homePositions[homePositions.length - 1];
        for (const [r, c] of homePositions) {
            if (r === keepR && c === keepC) continue;
            this.map[r][c] = LevelEditorCore.ERASE_TILE;
        }
    }

    getHomeCount() {
        let count = 0;
        for (const row of this.map) {
            for (const tile of row) {
                if (tile === 'home') count++;
            }
        }
        return count;
    }

    toSolverPayload() {
        const maxWalls = CONSTANTS.maxWallsForSize(this.size);
        return {
            size: this.size,
            levelName: this.levelName || CONSTANTS.LEVEL_EDITOR.DEFAULT_LEVEL_NAME,
            map: this.map.map(row => [...row]),
            maxWalls,
        };
    }

    toDraft() {
        return {
            size: this.size,
            levelName: this.levelName,
            selectedTile: this.selectedTile,
            map: this.map.map(row => [...row]),
            solvedResult: this.solvedResult,
        };
    }

    loadDraft(draft) {
        if (!draft || typeof draft !== 'object') return;
        if (typeof draft.size === 'number' && Array.isArray(draft.map) && draft.map.length === draft.size) {
            this.size = draft.size;
            this.map = draft.map.map(row => [...row]);
        }
        if (typeof draft.levelName === 'string') {
            this.levelName = draft.levelName;
        }
        if (typeof draft.selectedTile === 'string' && LevelEditorCore.EDITABLE_TILE_OPTIONS.includes(draft.selectedTile)) {
            this.selectedTile = draft.selectedTile;
        }
        this.ensureSingleHome();
        this.solvedResult = draft.solvedResult || null;
    }

    /**
     * Load map data from a parsed map object (e.g. from maps/YYYY.json or MapURLCodec).
     * The map must be a 2D array already converted from the compact string.
     * Resets solved state and uses the map name from the data if available.
     * @param {Object} options
     * @param {string[][]} options.map - 2D tile array (size × size)
     * @param {number} options.size - Grid dimension
     * @param {string} [options.levelName] - Optional level name
     */
    loadFromMapData({ map, size, levelName }) {
        const minSize = CONSTANTS.MIN_GRID_SIZE;
        const maxSize = CONSTANTS.MAX_GRID_SIZE;
        if (size < minSize || size > maxSize) {
            throw new Error(`Invalid map size ${size}`);
        }
        if (!Array.isArray(map) || map.length !== size) {
            throw new Error('map must be a 2D array matching size');
        }
        this.size = size;
        this.map = map.map(row => [...row]);
        this.levelName = (typeof levelName === 'string' && levelName.trim())
            ? levelName.trim()
            : CONSTANTS.LEVEL_EDITOR.DEFAULT_LEVEL_NAME;
        this.selectedTile = LevelEditorCore.DEFAULT_SELECTED_TILE;
        this.solvedResult = null;
        this.ensureSingleHome();
    }

    setSolvedResult(result) {
        this.solvedResult = result;
    }

    invalidateSolvedState() {
        this.solvedResult = null;
    }
}

LevelEditorCore.ERASE_TILE = 'grass';
LevelEditorCore.DEFAULT_SELECTED_TILE = 'water';
LevelEditorCore.EDITABLE_TILE_OPTIONS = Object.keys(TILE_DATA)
    .filter((name) => name !== LevelEditorCore.ERASE_TILE && name !== 'wall' && name !== 'filledHole');

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelEditorCore;
}
