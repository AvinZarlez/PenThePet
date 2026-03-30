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
        this.selectedTile = 'grass';
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
        this.selectedTile = 'grass';
    }

    setLevelName(name) {
        this.levelName = (name || '').trim();
        this.invalidateSolvedState();
    }

    setSelectedTile(tileName) {
        if (!CONSTANTS.LEVEL_EDITOR.TILE_OPTIONS.includes(tileName)) {
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

    _removeExistingHome() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.map[r][c] === 'home') {
                    this.map[r][c] = 'grass';
                }
            }
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
        if (typeof draft.selectedTile === 'string' && CONSTANTS.LEVEL_EDITOR.TILE_OPTIONS.includes(draft.selectedTile)) {
            this.selectedTile = draft.selectedTile;
        }
        this.solvedResult = draft.solvedResult || null;
    }

    setSolvedResult(result) {
        this.solvedResult = result;
    }

    invalidateSolvedState() {
        this.solvedResult = null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelEditorCore;
}
