/**
 * Shared map utility functions used by the generation and audit scripts.
 * Pure utilities — no entry-point logic, no direct I/O side-effects beyond what
 * callers explicitly request.
 */

const fs = require('fs');
const path = require('path');
const CONSTANTS = require('../../js/config/constants.js');

// ---------------------------------------------------------------------------
// Size input helpers
// ---------------------------------------------------------------------------

/**
 * Parse a size input string into either an exact size or a range.
 * Accepts:
 *   - Exact: "9"    → { type: 'exact', value: 9 }
 *   - Range: "7-17" → { type: 'range', min: 7, max: 17 }
 * Sizes must be within [MIN_GRID_SIZE, MAX_GRID_SIZE].
 * @param {string|number} sizeStr
 * @returns {{ type: 'exact', value: number } | { type: 'range', min: number, max: number }}
 */
function parseSizeInput(sizeStr) {
    const str = String(sizeStr).trim();
    const { MIN_GRID_SIZE, MAX_GRID_SIZE } = CONSTANTS;
    const rangeMatch = str.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        if (min > max) {
            throw new Error(`Invalid size range "${str}": min (${min}) must be <= max (${max})`);
        }
        if (min < MIN_GRID_SIZE || max > MAX_GRID_SIZE) {
            throw new Error(`Invalid size range "${str}": must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}`);
        }
        return { type: 'range', min, max };
    }
    const exact = parseInt(str);
    if (isNaN(exact)) {
        throw new Error(`Invalid size "${str}": must be a number or range (e.g., "9" or "7-17")`);
    }
    if (exact < MIN_GRID_SIZE || exact > MAX_GRID_SIZE) {
        throw new Error(`Invalid size ${exact}: must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}`);
    }
    return { type: 'exact', value: exact };
}

/**
 * Pick a random integer size from a parsed size input.
 * @param {{ type: 'exact', value: number } | { type: 'range', min: number, max: number }} parsed
 * @returns {number}
 */
function getRandomSize(parsed) {
    if (parsed.type === 'range') {
        const { min, max } = parsed;
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    return parsed.value;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Return the date string for the day after the given date.
 * Parses the date manually to avoid timezone-shift issues.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Next date in YYYY-MM-DD format
 */
function incrementDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Read all maps from the maps directory (one JSON file per year).
 * Returns a merged object keyed by date, or {} if the directory does not exist.
 * @param {string} mapsDir - Path to the maps/ directory
 * @returns {Object} Merged maps object keyed by date
 */
function readAllMaps(mapsDir) {
    if (!fs.existsSync(mapsDir)) {
        return {};
    }
    const merged = {};
    const files = fs.readdirSync(mapsDir).filter(f => /^\d{4}\.json$/.test(f)).sort();
    for (const file of files) {
        const data = fs.readFileSync(path.join(mapsDir, file), 'utf8');
        Object.assign(merged, JSON.parse(data));
    }
    return merged;
}

/**
 * Save a maps object to the maps directory, splitting by year.
 * Each year's maps are written to maps/YYYY.json.
 * @param {string} mapsDir - Path to the maps/ directory
 * @param {Object} maps - Maps object keyed by date
 */
function saveMapsToDirectory(mapsDir, maps) {
    if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true });
    }
    const byYear = {};
    for (const date of Object.keys(maps).sort()) {
        const year = date.substring(0, 4);
        if (!byYear[year]) byYear[year] = {};
        byYear[year][date] = maps[date];
    }
    for (const [year, yearMaps] of Object.entries(byYear)) {
        const filePath = path.join(mapsDir, `${year}.json`);
        fs.writeFileSync(filePath, JSON.stringify(yearMaps, null, 2));
    }
}

/**
 * Get the next available date from the maps directory (day after the latest existing date).
 * If no maps exist, returns today's date.
 * @param {string} mapsDir - Path to the maps/ directory
 * @returns {string} Date in YYYY-MM-DD format
 */
function getNextAvailableDate(mapsDir) {
    const maps = readAllMaps(mapsDir);
    const dates = Object.keys(maps).sort();

    if (dates.length === 0) {
        return new Date().toISOString().split('T')[0];
    }

    return incrementDate(dates[dates.length - 1]);
}

// ---------------------------------------------------------------------------
// Day number helpers
// ---------------------------------------------------------------------------

/**
 * Get the next sequential day number from the maps directory.
 * Returns 1 if the directory does not exist or has no maps.
 * @param {string} mapsDir - Path to the maps/ directory
 * @returns {number}
 */
function getNextDayNumber(mapsDir) {
    const maps = readAllMaps(mapsDir);

    let maxDay = 0;
    for (const dateKey in maps) {
        if (maps[dateKey].dayNumber && maps[dateKey].dayNumber > maxDay) {
            maxDay = maps[dateKey].dayNumber;
        }
    }

    return maxDay + 1;
}

// ---------------------------------------------------------------------------
// Database integrity helpers
// ---------------------------------------------------------------------------

/**
 * Validate the maps database for structural consistency.
 * Checks:
 *   A. No duplicate dates (impossible with object keys, kept for safety)
 *   B. Day numbers are sequential with no gaps
 *   C. No two maps share the same name
 * @param {Object} maps - Maps object keyed by date
 * @returns {{ valid: boolean, issues: Array }}
 */
function validateMapsDatabase(maps) {
    const issues = [];
    const dates = Object.keys(maps).sort();

    // Check A: Only one map per calendar day
    const dateSet = new Set();
    for (const date of dates) {
        if (dateSet.has(date)) {
            issues.push({
                type: 'duplicate_date',
                message: `Duplicate map for date: ${date}`,
                date: date
            });
        }
        dateSet.add(date);
    }

    // Check B: No gaps in day numbers
    const dayNumbers = dates.map(date => maps[date].dayNumber).sort((a, b) => a - b);
    for (let i = 0; i < dayNumbers.length; i++) {
        const expected = i + 1;
        if (dayNumbers[i] !== expected) {
            issues.push({
                type: 'gap_in_numbers',
                message: `Gap in day numbers: expected ${expected}, got ${dayNumbers[i]}`,
                expected: expected,
                actual: dayNumbers[i]
            });
            break; // Only report the first gap
        }
    }

    // Check C: No two maps have the same name
    const nameMap = new Map();
    for (const date of dates) {
        const mapName = maps[date].mapName;
        if (nameMap.has(mapName)) {
            issues.push({
                type: 'duplicate_name',
                message: `Duplicate map name "${mapName}" found on ${date} and ${nameMap.get(mapName)}`,
                name: mapName,
                dates: [nameMap.get(mapName), date]
            });
        }
        nameMap.set(mapName, date);
    }

    return {
        valid: issues.length === 0,
        issues: issues
    };
}

/**
 * Fix structural issues in the maps database.
 * - Reassigns sequential day numbers (no gaps)
 * - Disambiguates duplicate map names by appending a counter
 * @param {Object} maps - Maps object keyed by date
 * @returns {Object} Fixed maps object (does not mutate the input)
 */
function fixMapsDatabase(maps) {
    const fixed = { ...maps };
    const dates = Object.keys(fixed).sort();

    // Fix day numbers (no gaps, sequential)
    dates.forEach((date, index) => {
        fixed[date].dayNumber = index + 1;
    });

    // Fix duplicate names by appending a counter
    const usedNames = new Set();
    for (const date of dates) {
        let mapName = fixed[date].mapName;
        let counter = 1;

        while (usedNames.has(mapName)) {
            mapName = `${fixed[date].mapName}-${counter}`;
            counter++;
        }

        if (mapName !== fixed[date].mapName) {
            console.log(`  Renamed "${fixed[date].mapName}" to "${mapName}" for ${date}`);
            fixed[date].mapName = mapName;
        }

        usedNames.add(mapName);
    }

    return fixed;
}

// ---------------------------------------------------------------------------
// Weave insertion helper
// ---------------------------------------------------------------------------

/**
 * Weave-insert new map data objects into an existing maps database.
 * New maps are randomly inserted into the portion of the list starting
 * two days after the given reference date. Existing maps before that point
 * are not touched. All maps in the insertion zone (existing + new) are
 * reassigned sequential dates starting from today + 2 days.
 *
 * @param {Object} maps - Existing maps object keyed by date (YYYY-MM-DD)
 * @param {Array<Object>} newMapDataList - New map data objects (date fields will be overwritten)
 * @param {string} today - Reference date in YYYY-MM-DD format
 * @returns {Object} New maps object with weave-inserted maps
 */
function weaveInsert(maps, newMapDataList, today) {
    const insertionStartDate = incrementDate(incrementDate(today));

    // Split into fixed maps (before insertion zone) and the insertion zone list
    const sortedDates = Object.keys(maps).sort();
    const fixedMaps = {};
    const insertionZoneList = [];

    for (const date of sortedDates) {
        if (date < insertionStartDate) {
            fixedMaps[date] = { ...maps[date] };
        } else {
            insertionZoneList.push({ ...maps[date] });
        }
    }

    // Randomly insert each new map at a random position in the combined list
    const combinedList = [...insertionZoneList];
    for (const newMap of newMapDataList) {
        const insertIndex = Math.floor(Math.random() * (combinedList.length + 1));
        combinedList.splice(insertIndex, 0, { ...newMap });
    }

    // Assign sequential dates to the combined list starting from insertionStartDate
    let currentDate = insertionStartDate;
    for (const mapData of combinedList) {
        mapData.date = currentDate;
        currentDate = incrementDate(currentDate);
    }

    // Rebuild and return the complete maps object
    const result = { ...fixedMaps };
    for (const mapData of combinedList) {
        result[mapData.date] = mapData;
    }

    return result;
}

module.exports = {
    parseSizeInput,
    getRandomSize,
    incrementDate,
    readAllMaps,
    saveMapsToDirectory,
    getNextAvailableDate,
    getNextDayNumber,
    validateMapsDatabase,
    fixMapsDatabase,
    weaveInsert,
};

