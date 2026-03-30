'use strict';

/**
 * GameAnimationsMixin
 *
 * Rendering and animation methods extracted from Game.js.
 * Applied to Game.prototype via Object.assign at the bottom of Game.js.
 *
 * Methods:
 *   _setCellBackground, _addShoreOverlays, _createAssetOverlay, _addPawOverlays,
 *   _createCellElement, _animatePennedArea, _animatePawPath, _createPetWalker,
 *   _attachPetAtPosition, _startPetWander, _scheduleWanderStep, _startPetReturn,
 *   _findReturnPath, _showScorePopup, _showTileTooltip
 */

// Cardinal directions used for shore overlay placement.
const SHORE_DIRECTIONS = [
    { dRow: -1, dCol: 0, angle: 0 },    // top
    { dRow: 0,  dCol: 1, angle: 90 },   // right
    { dRow: 1,  dCol: 0, angle: 180 },  // bottom
    { dRow: 0,  dCol: -1, angle: 270 }, // left
];

// Pairs of adjacent cardinal directions whose inner corner needs a corner shore piece.
// Default orientation (0°) places the arc in the top-left; 90°/180°/270° rotate it
// to top-right/bottom-right/bottom-left respectively.
// `diag` is the diagonal tile in that corner's direction; if it is also water the
// inner corner is interior to the water body and no corner piece is needed.
const SHORE_CORNERS = [
    { dirs: [{ dRow: -1, dCol: 0 }, { dRow: 0, dCol: -1 }], diag: { dRow: -1, dCol: -1 }, angle: 0 },   // top-left
    { dirs: [{ dRow: -1, dCol: 0 }, { dRow: 0, dCol: 1 }],  diag: { dRow: -1, dCol: 1 },  angle: 90 },  // top-right
    { dirs: [{ dRow: 1,  dCol: 0 }, { dRow: 0, dCol: 1 }],  diag: { dRow: 1,  dCol: 1 },  angle: 180 }, // bottom-right
    { dirs: [{ dRow: 1,  dCol: 0 }, { dRow: 0, dCol: -1 }], diag: { dRow: 1,  dCol: -1 }, angle: 270 }, // bottom-left
];

const GameAnimationsMixin = {
/**
 * Apply the cell background — uses TileSvgs for dynamically-colored tiles
 * (grass, water, and tiles with a backgroundGroup), then falls back to the
 * tile's baseLayer asset, then to the first asset in the tile's asset list.
 * @private
 * @param {HTMLElement} cell - The cell element to update
 * @param {string} tileType - The tile type name
 * @param {boolean} isPenned - Whether the tile is currently penned/enclosed
 */
    _setCellBackground(cell, tileType, isPenned) {
    // TileSvgs generates data: URIs for grass, water, and tiles with a backgroundGroup (home, star, bee),
    // with the correct palette for penned vs normal state.
        if (typeof TileSvgs !== 'undefined') {
            const svgUri = TileSvgs.getTileBaseUri(tileType, isPenned);
            if (svgUri) {
                cell.style.background = `url("${svgUri}") center/cover no-repeat`;
                return;
            }
        }
        // Fallback for tiles not handled by TileSvgs
        const baseLayer = getTileBaseLayer(tileType);
        if (baseLayer) {
            cell.style.background = `url('assets/${baseLayer}') center/cover no-repeat`;
            return;
        }
        const assetList = getTileAssets(tileType, isPenned);
        if (assetList && assetList.length > 0) {
            cell.style.background = `url('assets/${assetList[0]}') center/cover no-repeat`;
        }
    },

    /**
 * Append shore-overlay DOM elements to a water cell based on its non-water neighbours.
 * For each of the four cardinal directions where the adjacent tile is not water
 * (or is outside the grid), a rotated shore image is added so that bodies of
 * water look like unified lakes with sandy edges only where they meet land.
 * In addition, for each pair of adjacent cardinal water neighbours that form an
 * L-shape (inner corner), a rotated shore-corner image is added to fill the gap.
 * @private
 * @param {HTMLElement} cell - The water cell element to append shore overlays to
 * @param {number} row - Row index of the cell
 * @param {number} col - Column index of the cell
 */
    _addShoreOverlays(cell, row, col) {
        for (const { dRow, dCol, angle } of SHORE_DIRECTIONS) {
            const neighbor = this.grid.getTile(row + dRow, col + dCol);
            if (neighbor !== 'water') {
                const shore = document.createElement('img');
                shore.src = 'assets/shore.svg';
                shore.alt = '';
                shore.className = 'shore-overlay';
                shore.setAttribute('aria-hidden', 'true');
                shore.style.transform = `rotate(${angle}deg)`;
                cell.appendChild(shore);
            }
        }

        // Corner pieces: render a quarter-circle shore when two adjacent cardinal
        // neighbours are both water, filling the inner-corner gap.
        // Skip the corner when the diagonal tile is also water — that corner is
        // interior to the water body and no gap exists there.
        for (const { dirs, diag, angle } of SHORE_CORNERS) {
            const allWater = dirs.every(({ dRow, dCol }) =>
                this.grid.getTile(row + dRow, col + dCol) === 'water'
            );
            const diagIsWater = this.grid.getTile(row + diag.dRow, col + diag.dCol) === 'water';
            if (allWater && !diagIsWater) {
                const corner = document.createElement('img');
                corner.src = 'assets/shore-corner.svg';
                corner.alt = '';
                corner.className = 'shore-corner-overlay';
                corner.setAttribute('aria-hidden', 'true');
                corner.style.transform = `rotate(${angle}deg)`;
                cell.appendChild(corner);
            }
        }
    },

    /**
 * Create a single asset overlay element — either an <img> for image files or a
 * <span> for emoji/text strings. Used by _createCellElement and _addPawOverlays.
 * @private
 * @param {string} asset - Asset filename (e.g. 'star.png') or emoji/text string
 * @param {string} imageClass - CSS class(es) to apply when the asset is an image file
 * @param {string} emojiClass - CSS class(es) to apply when the asset is emoji/text
 * @returns {HTMLElement} The created <img> or <span> element
 */
    _createAssetOverlay(asset, imageClass, emojiClass) {
        if (/\.(svg|png|jpe?g|webp|gif)$/i.test(asset)) {
            const img = document.createElement('img');
            img.src = `assets/${asset}`;
            img.alt = '';
            img.className = imageClass;
            img.setAttribute('aria-hidden', 'true');
            return img;
        }
        const span = document.createElement('span');
        span.className = emojiClass;
        span.textContent = asset;
        span.setAttribute('aria-hidden', 'true');
        return span;
    },

    /**
 * Append paw-overlay DOM elements to a cell for a given tile and rotation angle.
 * @private
 * @param {HTMLElement} cell - The cell element to append paw overlays to
 * @param {string} tileType - The tile type name
 * @param {number} angle - Rotation angle in degrees
 */
    _addPawOverlays(cell, tileType, angle) {
        const pawAssets = getPawOverlay(tileType);
        for (const asset of pawAssets) {
            const el = this._createAssetOverlay(asset, 'paw-overlay', 'paw-overlay-emoji');
            if (el.tagName === 'IMG') {
                el.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            }
            cell.appendChild(el);
        }
    },

    /**
 * Create a DOM element for a single cell
 * @private
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {string} tileType - The tile type name
 * @param {Set} pathSet - Set of coordinates that are part of the path
 * @param {Set} accessibleTiles - Set of coordinates accessible when penned
 * @param {Map} directions - Map of coordinate strings to rotation angles for paw direction
 * @returns {HTMLElement} The created cell element
 */
    _createCellElement(row, col, tileType, pathSet, accessibleTiles, directions) {
        const cell = document.createElement('div');
        const tileInfo = getTileType(tileType);

        cell.className = `cell ${tileInfo.cssClass}`;

        // Add penned class if this tile is accessible when pet is penned
        const coordKey = `${row},${col}`;
        const isPennedTile = accessibleTiles.has(coordKey);
        if (isPennedTile) {
            cell.classList.add('penned');
        }

        cell.dataset.row = row;
        cell.dataset.col = col;

        // Set background — TileSvgs (grass/water/backgroundGroup), baseLayer asset, or first asset
        this._setCellBackground(cell, tileType, isPennedTile);

        if (getTileBaseLayer(tileType)) {
        // Tiles with a base layer (grass, water): pick one variant deterministically
            const variantAssets = getTileAssets(tileType, false);
            if (variantAssets && variantAssets.length > 0) {
            // Deterministic per-cell selection: primes 13 and 7 avoid diagonal repetition
            // patterns on any grid size, ensuring visual variety across neighbours
                const variantIndex = (row * 13 + col * 7) % variantAssets.length;
                cell.dataset.variantIndex = variantIndex;
                let variantOverlay;
                if (typeof TileSvgs !== 'undefined') {
                    const svgUri = TileSvgs.getTileVariantUri(tileType, variantIndex, isPennedTile);
                    if (svgUri) {
                        const img = document.createElement('img');
                        img.src = svgUri;
                        img.alt = '';
                        img.className = 'tile-overlay-fill';
                        img.setAttribute('aria-hidden', 'true');
                        variantOverlay = img;
                    }
                }
                if (!variantOverlay) {
                    variantOverlay = this._createAssetOverlay(variantAssets[variantIndex], 'tile-overlay-fill', 'tile-overlay-emoji');
                }
                cell.appendChild(variantOverlay);
            }
        // Penned state for baseLayer tiles is handled entirely by TileSvgs recolouring
        // the base and variant — no enclosed-asset overlays needed here.
        } else {
        // Standard tiles (home, star, bee, wall, etc.)
        // Tiles with backgroundGroup have TileSvgs managing their background, so ALL
        // assets are icon overlays (start at index 0).  Other tiles skip index 0
        // (which was loaded as the CSS background).
            const assetList = getTileAssets(tileType, isPennedTile);
            const hasBackgroundGroup = !!getTileBackgroundGroup(tileType);
            const startIndex = hasBackgroundGroup ? 0 : 1;
            if (assetList && assetList.length > startIndex) {
                const isLastFloating = tileInfo.floatAnimation === true;
                for (let i = startIndex; i < assetList.length; i++) {
                    const asset = assetList[i];
                    const isTopLayer = isLastFloating && i === assetList.length - 1;
                    const imageClass = isTopLayer ? 'tile-overlay tile-overlay-float' : 'tile-overlay';
                    const emojiClass = isTopLayer ? 'tile-overlay-emoji tile-overlay-float' : 'tile-overlay-emoji';
                    cell.appendChild(this._createAssetOverlay(asset, imageClass, emojiClass));
                }
            }
        }

        // Add shore overlays on water tiles (one per non-water neighbour side)
        if (tileType === 'water') {
            this._addShoreOverlays(cell, row, col);
        }

        // Add paw overlay if this cell is on the escape path
        if (pathSet && pathSet.has(coordKey)) {
            const angle = directions && directions.has(coordKey) ? directions.get(coordKey) : 0;
            this._addPawOverlays(cell, tileType, angle);
        }

        // Add accessibility attributes
        if (tileInfo.clickable) {
            cell.setAttribute('role', 'button');
        }
        // Make all cells focusable for keyboard navigation
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', tileInfo.ariaLabel(row, col));

        // Add event listeners
        cell.addEventListener('click', () => this.handleCellClick(row, col));
        if (typeof this.handleCellContextMenu === 'function') {
            cell.addEventListener('contextmenu', (e) => this.handleCellContextMenu(e, row, col));
        }
        cell.addEventListener('keydown', (e) => this.handleCellKeydown(e, row, col));
        cell.addEventListener('focus', () => this.lastFocusedCell = { row, col });

        return cell;
    },

    /**
 * Animate the penned area spreading outward from home using BFS waves.
 * Each wave of tiles (by BFS distance from home) is revealed after an
 * incremental delay so the enclosed area appears to "fill in" rather
 * than appearing all at once.
 * @param {Set} accessibleTiles - Set of coordinate strings in the penned area
 * @param {Function} [onComplete] - Optional callback fired after the last wave
 */
    _animatePennedArea(accessibleTiles, onComplete) {
        const homePos = this.grid.getHomePosition();
        if (!homePos) return;

        const { row: startRow, col: startCol } = homePos;
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);
        let currentWave = [[startRow, startCol]];
        const waves = [];
        const neighborDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        // BFS to group accessible tiles by wave distance from home
        while (currentWave.length > 0) {
            waves.push([...currentWave]);
            const nextWave = [];
            for (const [row, col] of currentWave) {
                for (const [dr, dc] of neighborDirs) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    const coordKey = `${newRow},${newCol}`;
                    if (!visited.has(coordKey) && accessibleTiles.has(coordKey)) {
                        visited.add(coordKey);
                        nextWave.push([newRow, newCol]);
                    }
                }
            }
            currentWave = nextWave;
        }

        const delay = CONSTANTS.PENNED_ANIMATION_DELAY_MS;
        waves.forEach((wave, waveIndex) => {
            const timeoutId = setTimeout(() => {
                for (const [row, col] of wave) {
                    const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('penned');
                        const tileType = this.grid.getTile(row, col);
                        this._setCellBackground(cell, tileType, true);
                        // For tiles with a variant overlay (grass), recolour it to the
                        // penned palette so the blades turn golden alongside the base.
                        if (getTileBaseLayer(tileType) && typeof TileSvgs !== 'undefined') {
                            const variantIdx = parseInt(cell.dataset.variantIndex, 10);
                            const variantEl = cell.querySelector('.tile-overlay-fill');
                            if (variantEl && variantEl.tagName === 'IMG' && !isNaN(variantIdx)) {
                                const uri = TileSvgs.getTileVariantUri(tileType, variantIdx, true);
                                if (uri) variantEl.src = uri;
                            }
                        }
                        const score = getTileScore(tileType);
                        if (score !== 0 && score !== 1) {
                            this._showScorePopup(cell, score);
                        }
                    }
                }
            }, waveIndex * delay);
            this._pennedAnimationTimeouts.push(timeoutId);
        });

        if (onComplete) {
            const completionId = setTimeout(onComplete, waves.length * delay);
            this._pennedAnimationTimeouts.push(completionId);
        }
    },

    /**
 * Animate paw prints appearing one step at a time along the escape path.
 * Each tile in the ordered path (from home to the grid edge) gets its paw
 * overlay after an incremental delay, creating a "walking" effect. After
 * each paw has been visible for PAW_FADE_OUT_DELAY_MS it fades out and is
 * removed. Once all paws have disappeared the animation loops from the start.
 * @param {Array<string>} orderedPath - Ordered array of "row,col" coordinate strings
 * @param {Map} directions - Map of coordinate strings to rotation angles
 */
    _animatePawPath(orderedPath, directions) {
        const delay = CONSTANTS.PAW_ANIMATION_DELAY_MS;
        const fadeDelay = CONSTANTS.PAW_FADE_OUT_DELAY_MS;
        const fadeDuration = CONSTANTS.PAW_FADE_OUT_DURATION_MS;

        orderedPath.forEach((coordKey, stepIndex) => {
            const [row, col] = coordKey.split(',').map(Number);

            // Show paw
            const showId = setTimeout(() => {
                const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    const angle = directions && directions.has(coordKey) ? directions.get(coordKey) : 0;
                    this._addPawOverlays(cell, this.grid.getTile(row, col), angle);
                }
            }, stepIndex * delay);
            this._pawAnimationTimeouts.push(showId);

            // Start fading the paw out
            const fadeId = setTimeout(() => {
                const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.querySelectorAll('.paw-overlay, .paw-overlay-emoji').forEach(el => {
                        el.classList.add('paw-fading');
                    });
                }
            }, stepIndex * delay + fadeDelay);
            this._pawAnimationTimeouts.push(fadeId);

            // Remove paw DOM elements after the fade-out animation completes
            const removeId = setTimeout(() => {
                const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.querySelectorAll('.paw-overlay, .paw-overlay-emoji').forEach(el => el.remove());
                }
            }, stepIndex * delay + fadeDelay + fadeDuration);
            this._pawAnimationTimeouts.push(removeId);
        });

        // Restart the whole animation after every paw has faded out
        if (orderedPath.length > 0) {
            const restartDelay = (orderedPath.length - 1) * delay + fadeDelay + fadeDuration;
            const restartId = setTimeout(() => {
                this._animatePawPath(orderedPath, directions);
            }, restartDelay);
            this._pawAnimationTimeouts.push(restartId);
        }
    },

    /**
 * Create the pet walker overlay element on the grid at the given position.
 * The walker is positioned absolutely over the entire grid using a CSS
 * transform driven by --pet-row and --pet-col custom properties.
 * It transitions smoothly between positions via CSS transition.
 * Any previously existing walker is replaced.
 * @private
 * @param {number} row - Initial row index
 * @param {number} col - Initial column index
 */
    _createPetWalker(row, col) {
        const existing = this.gridElement.querySelector('.pet-walker');
        if (existing) existing.remove();
        const walker = document.createElement('span');
        walker.className = 'pet-walker';
        walker.textContent = this.petEmoji;
        walker.setAttribute('aria-hidden', 'true');
        walker.style.setProperty('--pet-row', row);
        walker.style.setProperty('--pet-col', col);
        this.gridElement.appendChild(walker);
    },

    /**
 * Move the pet walker to a specific cell by updating its CSS custom
 * properties. The CSS transition animates the resulting transform change.
 * @private
 * @param {number} row - Target row index
 * @param {number} col - Target column index
 */
    _attachPetAtPosition(row, col) {
        const walker = this.gridElement.querySelector('.pet-walker');
        if (walker) {
            walker.style.setProperty('--pet-row', row);
            walker.style.setProperty('--pet-col', col);
        }
    },

    /**
 * Begin the pet wandering animation within the penned area.
 * The pet steps one tile at a time to a random accessible neighbor,
 * repeating indefinitely until cancelled.
 * @param {Set} accessibleTiles - Set of "row,col" strings the pet may visit
 */
    _startPetWander(accessibleTiles) {
        if (this._petPos === null) {
            const homePos = this.grid.getHomePosition();
            if (!homePos) return;
            this._petPos = { row: homePos.row, col: homePos.col };
        }
        // Remove return-speed class so wander transitions use the slower CSS default
        const walker = this.gridElement.querySelector('.pet-walker');
        if (walker) walker.classList.remove('pet-returning');
        this._scheduleWanderStep(accessibleTiles);
    },

    /**
 * Schedule one wander step, then recursively schedule the next.
 * @private
 * @param {Set} accessibleTiles - Set of "row,col" strings the pet may visit
 */
    _scheduleWanderStep(accessibleTiles) {
        const timeoutId = setTimeout(() => {
            if (this._petPos === null) return;

            // Collect accessible cardinal neighbors
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            const neighbors = [];
            for (const [dr, dc] of dirs) {
                const nr = this._petPos.row + dr;
                const nc = this._petPos.col + dc;
                if (accessibleTiles.has(`${nr},${nc}`)) {
                    neighbors.push({ row: nr, col: nc });
                }
            }

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this._petPos = next;
                this._attachPetAtPosition(next.row, next.col);
            }

            this._scheduleWanderStep(accessibleTiles);
        }, CONSTANTS.PET_WANDER_STEP_MS);
        this._petWanderTimeouts.push(timeoutId);
    },

    /**
 * Walk the pet back to the home tile one step at a time.
 * Walls are treated as passable so the pet can never be stranded.
 * When the pet reaches home, _petPos is set to null and onComplete is called.
 * @param {Function} [onComplete] - Optional callback fired once the pet is home
 */
    _startPetReturn(onComplete) {
        if (this._petPos === null) {
            if (onComplete) onComplete();
            return;
        }

        const homePos = this.grid.getHomePosition();
        if (!homePos) {
            this._petPos = null;
            if (onComplete) onComplete();
            return;
        }

        // Already home
        if (this._petPos.row === homePos.row && this._petPos.col === homePos.col) {
            this._petPos = null;
            if (onComplete) onComplete();
            return;
        }

        const path = this._findReturnPath(this._petPos, homePos);
        if (!path || path.length === 0) {
            this._petPos = null;
            if (onComplete) onComplete();
            return;
        }

        // Speed up the CSS transition for each return step
        const walker = this.gridElement.querySelector('.pet-walker');
        if (walker) walker.classList.add('pet-returning');

        path.forEach((pos, index) => {
            const timeoutId = setTimeout(() => {
                this._petPos = pos;
                this._attachPetAtPosition(pos.row, pos.col);

                if (index === path.length - 1) {
                // Arrived home
                    this._petPos = null;
                    if (onComplete) onComplete();
                }
            }, (index + 1) * CONSTANTS.PET_RETURN_STEP_MS);
            this._petReturnTimeouts.push(timeoutId);
        });
    },

    /**
 * BFS from fromPos to toPos, treating only water tiles as blocking.
 * Walls are passable so the pet can always reach home.
 * @private
 * @param {{row:number,col:number}} fromPos - Starting position
 * @param {{row:number,col:number}} toPos   - Target position (home)
 * @returns {Array<{row:number,col:number}>|null} Ordered steps from fromPos to toPos
 *   (excluding fromPos, including toPos), or null if no path exists.
 */
    _findReturnPath(fromPos, toPos) {
        const startKey = `${fromPos.row},${fromPos.col}`;
        const goalKey = `${toPos.row},${toPos.col}`;
        if (startKey === goalKey) return [];

        const parent = new Map([[startKey, null]]);
        const queue = [startKey];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const key = queue.shift();
            const [r, c] = key.split(',').map(Number);

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const nKey = `${nr},${nc}`;

                if (nr < 0 || nr >= this.grid.size || nc < 0 || nc >= this.grid.size) continue;
                if (parent.has(nKey)) continue;

                // Only water blocks the return path; walls are passable
                if (this.grid.getTile(nr, nc) === 'water') continue;

                parent.set(nKey, key);

                if (nKey === goalKey) {
                // Reconstruct path
                    const path = [];
                    let cur = nKey;
                    while (cur && cur !== startKey) {
                        const [pr, pc] = cur.split(',').map(Number);
                        path.unshift({ row: pr, col: pc });
                        cur = parent.get(cur);
                    }
                    return path;
                }

                queue.push(nKey);
            }
        }

        return null;
    },

    /**
 * Show a floating score popup above a cell when it becomes penned.
 * Displays the score value with a "+" prefix for positive values.
 * The popup is appended to the grid element (not the cell) so it is not
 * clipped by the cell's overflow:hidden and floats above all sibling cells.
 * It fades in, floats up, and disappears automatically.
 * Only called for tiles with a non-standard score (not 0 or 1).
 * @private
 * @param {HTMLElement} cell - The cell element whose position determines the popup location
 * @param {number} score - The score value to display
 */
    _showScorePopup(cell, score) {
        const row = parseInt(cell.dataset.row, 10) || 0;
        const col = parseInt(cell.dataset.col, 10) || 0;
        const popup = document.createElement('span');
        popup.className = `score-popup ${score > 0 ? 'positive' : 'negative'}`;
        popup.textContent = score > 0 ? `+${score}` : `${score}`;
        popup.setAttribute('aria-hidden', 'true');
        const durationMs = CONSTANTS.SCORE_POPUP_DURATION_MS;
        popup.style.setProperty('--score-popup-duration', `${durationMs}ms`);
        popup.style.setProperty('--popup-row', row);
        popup.style.setProperty('--popup-col', col);
        this.gridElement.appendChild(popup);
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, durationMs);
    },

    /**
 * Show a floating thought-bubble tooltip on a non-clickable tile when tapped.
 * Displays the tile's description text. The tooltip fades in, floats up, and
 * disappears automatically. Any existing tooltip on the same cell is removed first.
 * @private
 * @param {HTMLElement} cell - The cell element to attach the tooltip to
 * @param {string} tileType - The tile type name (key in TILE_DATA)
 */
    _showTileTooltip(cell, tileType) {
    // Remove any existing tooltip on this cell so rapid taps don't stack
        const existing = cell.querySelector('.tile-tooltip');
        if (existing) {
            existing.remove();
        }

        const tileInfo = TILE_DATA[tileType];
        if (!tileInfo || !tileInfo.descriptionKey) {
            return;
        }
        const text = I18N.t(tileInfo.descriptionKey);
        if (!text) {
            return;
        }

        const tooltip = document.createElement('span');
        tooltip.className = 'tile-tooltip';
        tooltip.textContent = text;
        tooltip.setAttribute('aria-hidden', 'true');
        const durationMs = CONSTANTS.TILE_TOOLTIP_DURATION_MS;
        tooltip.style.setProperty('--tile-tooltip-duration', `${durationMs}ms`);
        cell.appendChild(tooltip);
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, durationMs);
    }

};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAnimationsMixin;
}
