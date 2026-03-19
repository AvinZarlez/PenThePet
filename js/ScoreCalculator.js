/**
 * ScoreCalculator
 *
 * Pure functions for calculating game scores from a set of accessible tiles.
 * Keeping score logic in a dedicated module makes it easy to swap out the
 * scoring rules when implementing a different game type without touching
 * the rest of the game controller.
 *
 * Usage (in Game.js):
 *   const score = ScoreCalculator.calculateAreaScore(
 *       accessibleTileKeys,
 *       (row, col) => this.grid.getTile(row, col),
 *       getTileScore
 *   );
 */

const ScoreCalculator = {

    /**
     * Sum the scores of all tiles reachable within an enclosed area.
     *
     * @param {Set<string>} accessibleTileKeys - Set of "row,col" coordinate strings
     *   for every tile inside the penned area (as returned by Game.getAccessibleTiles).
     * @param {function(number, number): string} getTile - Function that returns the
     *   tile-type name for a given (row, col) position.
     * @param {function(string): number} scoreFn - Function that returns the numeric
     *   score for a given tile-type name (e.g. getTileScore from tileData.js).
     * @returns {number} Total weighted score of the enclosed area.
     */
    calculateAreaScore(accessibleTileKeys, getTile, scoreFn) {
        let score = 0;
        for (const coordKey of accessibleTileKeys) {
            const [row, col] = coordKey.split(',').map(Number);
            score += scoreFn(getTile(row, col));
        }
        return score;
    },

};

// Export for Node.js (Jest tests); in the browser the object is a global.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreCalculator;
}
