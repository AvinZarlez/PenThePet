/**
 * Cloud Migration Module
 *
 * Provides versioned schema management for cloud-synced data (submissions).
 * Each schema version has a corresponding migration function that upgrades
 * data to the next version. Migrations run automatically whenever data is
 * loaded from a cookie or received from Firestore.
 *
 * ── VERSION HISTORY ──────────────────────────────────────────────────────────
 *
 *   1.0  — Original format: { score, walls, timestamp, time }
 *          No __version field; absence of the field implies "1.0".
 *
 *   1.1  — Added hintsUsed: string[] to submission data.
 *          Introduced __version field.
 *
 *   1.2  — Added goal: number to submission data.
 *          Stores the map's optimal goal at the time the user submitted so
 *          that map-version migration can correctly detect a "perfect score"
 *          even when the map's goal changes between versions.
 *          Older saves without this field have goal back-filled to null,
 *          indicating that the original goal is unknown.
 *
 * ── HOW TO ADD A NEW VERSION ──────────────────────────────────────────────────
 *
 *   1. Bump CURRENT_VERSION (e.g. '1.3').
 *   2. Add a migration function keyed by the version it upgrades FROM:
 *        submissionMigrations['1.2'] = function(data) { ... return { ...data, __version: '1.3' }; };
 *   3. The migration chain runs automatically — no manual calls needed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Import CONSTANTS if in Node.js environment
if (typeof CONSTANTS === 'undefined' && typeof require !== 'undefined') {
    global.CONSTANTS = require('../config/constants.js');
}

const CloudMigration = (function () {
    // The schema version all new submission data is written in.
    const CURRENT_VERSION = '1.2';

    /**
     * Migration functions keyed by the version they upgrade FROM.
     * Each function receives a copy of the data at that version and must
     * return a new object at the next version (with __version updated).
     */
    const submissionMigrations = {
        // v1.0 → v1.1: add hintsUsed array and __version field
        '1.0': function (data) {
            return Object.assign({}, data, {
                hintsUsed: Array.isArray(data.hintsUsed) ? data.hintsUsed : [],
                __version: '1.1',
            });
        },
        // v1.1 → v1.2: add goal field (null for old saves where the original goal is unknown)
        '1.1': function (data) {
            return Object.assign({}, data, {
                goal: typeof data.goal === 'number' ? data.goal : null,
                __version: '1.2',
            });
        },
    };

    /**
     * Return the schema version of a submission document.
     * Documents without a __version field are treated as v1.0 (legacy).
     * @param {Object} data
     * @returns {string}
     */
    function getVersion(data) {
        return (data && data.__version) || '1.0';
    }

    /**
     * Migrate a submission document to the current schema version.
     * Runs all necessary migration steps in sequence.
     * Safe to call on already-current data — returns the input unchanged.
     * @param {Object} data - Raw submission object (may be any version)
     * @returns {Object} Data at CURRENT_VERSION
     */
    function migrateSubmission(data) {
        if (!data || typeof data !== 'object') return data;
        let result = Object.assign({}, data);
        let version = getVersion(result);
        while (version !== CURRENT_VERSION) {
            const fn = submissionMigrations[version];
            if (!fn) break; // No migration path from this version — leave as-is
            result = fn(result);
            version = getVersion(result);
        }
        return result;
    }

    return {
        /** The schema version new data is written in. */
        CURRENT_VERSION,
        /** Return the version of a submission document (defaults to '1.0'). */
        getVersion,
        /** Upgrade a submission document to the current schema version. */
        migrateSubmission,
    };
})();

// Export for use in other modules (Node.js / tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudMigration;
}
