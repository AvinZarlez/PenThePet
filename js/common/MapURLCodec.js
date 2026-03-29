/**
 * MapURLCodec
 *
 * Encodes and decodes map data to/from a compact, URL-safe base64url string.
 * Used by the "Share Map URL" debug tool and by the `?map=` URL parameter
 * loader so that a complete puzzle (including metadata) can be shared as a
 * single link.
 *
 * Regular levels (loaded from maps/YYYY.json) continue to use their date string
 * (YYYY-MM-DD) as the save key, exactly as before — this codec only applies to
 * custom maps shared via a `?map=` URL parameter.
 *
 * Encoding format:
 *   JSON({ v, date, mapName, size, goal, maxWalls, map, optimalSolution, dayNumber })
 *   → base64url (URL-safe base64, no padding)
 *
 *   `v` is the codec schema version (integer).  Increment it whenever the
 *   payload structure changes so that future decoders can handle old URLs.
 *
 * Save key format (custom maps only):
 *   "map_<8-char FNV-32 hex hash of map string + "|" + size>"
 *
 *   The save key intentionally omits metadata (mapName, date) so that the same
 *   puzzle layout always maps to the same save record regardless of how the
 *   metadata changes over time.  All save/submission data is stored under this
 *   key using the same `CloudMigration`-versioned schema as regular levels, so
 *   existing migration infrastructure handles schema upgrades automatically.
 *
 * ── CODEC VERSION HISTORY ────────────────────────────────────────────────────
 *
 *   1  — Initial format: { v, date, mapName, size, goal, maxWalls, map,
 *          optimalSolution, dayNumber }
 *
 * ── HOW TO ADD A NEW CODEC VERSION ──────────────────────────────────────────
 *
 *   1. Bump CODEC_VERSION below.
 *   2. Update encodeMapData() to write the new fields.
 *   3. Add a migration case in decodeMapData() keyed to the OLD version number,
 *      transforming the old payload shape to the new one before validation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MapURLCodec = (function () {
    /** Current codec schema version.  Stored in every encoded payload as `v`. */
    const CODEC_VERSION = 1;

    /**
     * Migrate an older decoded payload to the shape expected by the current
     * version.  Add a case here whenever CODEC_VERSION is incremented.
     * @param {Object} payload - Raw decoded JSON object (may be any version)
     * @returns {Object} Payload at CODEC_VERSION shape
     */
    function _migratePayload(payload) {
        const version = typeof payload.v === 'number' ? payload.v : 1;
        // Example future migration: case 1 → 2 would go here as:
        //   if (version === 1) { return { ...payload, v: 2, newField: defaultValue }; }
        // Currently only version 1 exists so no transformation is needed.
        void version; // suppress unused-variable lint warnings
        return payload;
    }

    /**
     * Encode map data to a URL-safe base64url string.
     * Includes every field required to exactly replicate the level.
     *
     * @param {Object} mapData - Map data object (from maps/YYYY.json or game state)
     * @param {string}   mapData.map             - Compact tile string (size × size chars)
     * @param {number}   mapData.size            - Grid side length
     * @param {number}   mapData.goal            - Target enclosed area
     * @param {number}   mapData.maxWalls        - Wall budget
     * @param {string}   [mapData.date]          - Puzzle date (YYYY-MM-DD)
     * @param {string}   [mapData.mapName]       - Human-readable level name
     * @param {Array}    [mapData.optimalSolution] - Flat [r0,c0,r1,c1,…] array
     * @param {number}   [mapData.dayNumber]     - Sequential day number
     * @returns {string} URL-safe encoded string
     */
    function encodeMapData(mapData) {
        const payload = {
            v: CODEC_VERSION,
            date: mapData.date || '',
            mapName: mapData.mapName || '',
            size: mapData.size,
            goal: mapData.goal,
            maxWalls: mapData.maxWalls,
            map: mapData.map,
            optimalSolution: mapData.optimalSolution || [],
            dayNumber: mapData.dayNumber !== undefined ? mapData.dayNumber : null,
        };
        const json = JSON.stringify(payload);
        // btoa works on Latin-1 byte strings; the encodeURIComponent round-trip
        // safely handles any Unicode characters that may appear in mapName.
        const bytes = encodeURIComponent(json).replace(
            /%([0-9A-F]{2})/gi,
            (_match, hex) => String.fromCharCode(parseInt(hex, 16))
        );
        return btoa(bytes)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Decode a URL-safe base64url string back to a map data object.
     * Applies codec version migration before validating required fields.
     * Returns null if decoding, migration, or validation fails.
     *
     * @param {string} encoded - Value produced by encodeMapData()
     * @returns {Object|null} Map data object, or null on failure
     */
    function decodeMapData(encoded) {
        if (typeof encoded !== 'string' || encoded.length === 0) return null;
        try {
            // Restore standard base64 characters and re-add stripped padding.
            const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
            const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
            const bytes = atob(padded);
            // Reverse the encodeURIComponent byte-packing used during encoding.
            const json = decodeURIComponent(
                Array.from(bytes)
                    .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join('')
            );
            let payload = JSON.parse(json);

            // Upgrade older payloads to the current codec version.
            payload = _migratePayload(payload);

            // Validate required game-play fields.
            if (
                typeof payload.map !== 'string' ||
                payload.map.length === 0 ||
                typeof payload.size !== 'number' ||
                typeof payload.goal !== 'number' ||
                typeof payload.maxWalls !== 'number'
            ) {
                return null;
            }
            // Validate size is within the allowed bounds.
            // Fall back to the well-known limits if CONSTANTS is not yet loaded.
            const minSize = (typeof CONSTANTS !== 'undefined') ? CONSTANTS.MIN_GRID_SIZE : 9;
            const maxSize = (typeof CONSTANTS !== 'undefined') ? CONSTANTS.MAX_GRID_SIZE : 17;
            if (payload.size < minSize || payload.size > maxSize) {
                return null;
            }
            // Validate that the map string length matches the declared grid size.
            if (payload.map.length !== payload.size * payload.size) {
                return null;
            }
            return payload;
        } catch {
            return null;
        }
    }

    /**
     * Compute a stable, short save-key for a map loaded from a `?map=` URL
     * parameter.  The key is derived from the puzzle content (map string +
     * size) so that the same layout always produces the same save record,
     * independent of metadata changes such as renaming the level.
     *
     * Only call this for custom maps loaded from a URL parameter.  Regular
     * levels (from maps/YYYY.json) keep their date string as the save key.
     *
     * @param {Object} mapData - Map data (must have `map` string and `size` number)
     * @returns {string} Save key in the form "map_<8 hex chars>"
     */
    function computeSaveKey(mapData) {
        const input = mapData.map + '|' + mapData.size;
        return 'map_' + _fnv32hex(input);
    }

    /**
     * FNV-32 hash returning an 8-character lowercase hex string.
     * @param {string} str
     * @returns {string}
     */
    function _fnv32hex(str) {
        let hash = 0x811c9dc5; // FNV offset basis
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            // Multiply by FNV prime (0x01000193), keeping 32-bit unsigned.
            hash = (Math.imul(hash, 0x01000193)) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    return {
        /** Current codec schema version stored in every encoded payload. */
        CODEC_VERSION,
        encodeMapData,
        decodeMapData,
        computeSaveKey,
        /** Exposed for unit testing only. */
        _fnv32hex,
    };
})();

// Export for Node.js (tests / generation scripts).
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapURLCodec;
}
