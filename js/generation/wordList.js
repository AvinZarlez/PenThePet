/**
 * Word List
 * 
 * A collection of random English words for map naming.
 * These words are used to give each generated map a unique, memorable name.
 */

const WORD_LIST = [
    // Nature words
    'Meadow', 'River', 'Forest', 'Mountain', 'Ocean', 'Desert', 'Valley', 'Canyon',
    'Prairie', 'Tundra', 'Glacier', 'Lagoon', 'Marsh', 'Swamp', 'Jungle', 'Savanna',

    // Weather/Sky words
    'Thunder', 'Lightning', 'Storm', 'Cloud', 'Mist', 'Fog', 'Rainbow', 'Sunset',
    'Sunrise', 'Twilight', 'Aurora', 'Eclipse', 'Meteor', 'Comet', 'Nebula', 'Galaxy',

    // Animals
    'Eagle', 'Falcon', 'Hawk', 'Raven', 'Phoenix', 'Dragon', 'Tiger', 'Lion',
    'Bear', 'Wolf', 'Fox', 'Deer', 'Rabbit', 'Dolphin', 'Whale', 'Shark',

    // Colors
    'Crimson', 'Azure', 'Emerald', 'Amber', 'Violet', 'Indigo', 'Scarlet', 'Cobalt',
    'Jade', 'Ruby', 'Sapphire', 'Topaz', 'Pearl', 'Ivory', 'Onyx', 'Silver',

    // Abstract concepts
    'Harmony', 'Serenity', 'Tranquil', 'Mystic', 'Enigma', 'Paradox', 'Infinity', 'Eternity',
    'Rapids', 'Horizon', 'Zenith', 'Vertex', 'Apex', 'Pinnacle', 'Summit', 'Peak',

    // Elements/Materials
    'Crystal', 'Diamond', 'Steel', 'Bronze', 'Iron', 'Gold', 'Copper', 'Marble',
    'Granite', 'Quartz', 'Obsidian', 'Coral', 'Beryl', 'Slate', 'Flint', 'Stone',

    // Time periods
    'Dawn', 'Dusk', 'Noon', 'Midnight', 'Autumn', 'Spring', 'Summer', 'Winter',
    'Solstice', 'Equinox', 'Century', 'Millennium', 'Era', 'Epoch', 'Eon', 'Age',

    // Directions/Positions
    'North', 'South', 'East', 'West', 'Polar', 'Nadir', 'Frontier', 'Border',
    'Edge', 'Core', 'Center', 'Periphery', 'Margin', 'Boundary', 'Limit', 'Threshold',

    // Mythological/Fantasy
    'Olympus', 'Valhalla', 'Avalon', 'Atlantis', 'Utopia', 'Arcadia', 'Elysium', 'Camelot',
    'Asgard', 'Sanctuary', 'Haven', 'Refuge', 'Citadel', 'Fortress', 'Bastion', 'Stronghold',

    // Natural phenomena
    'Vortex', 'Torrent', 'Geyser', 'Volcano', 'Quake', 'Avalanche', 'Blizzard', 'Hurricane',
    'Typhoon', 'Cyclone', 'Tempest', 'Maelstrom', 'Whirlpool', 'Cascade', 'Falls', 'Cataract',

    // Terrain features
    'Plateau', 'Mesa', 'Butte', 'Ridge', 'Gorge', 'Ravine', 'Cliff', 'Crag',
    'Spire', 'Crest', 'Knoll', 'Hillock', 'Mound', 'Dune', 'Outcrop', 'Bluff',

    // Additional nature words
    'Brook', 'Creek', 'Grove', 'Hollow', 'Inlet', 'Isle', 'Moor', 'Oasis',
    'Pond', 'Reef', 'Shore', 'Tide', 'Trail', 'Glen', 'Heath', 'Fern',

    // Additional sky/cosmic words
    'Cosmos', 'Flare', 'Haze', 'Lunar', 'Nova', 'Orbit', 'Prism', 'Radiance',
    'Shimmer', 'Solar', 'Stellar', 'Glow', 'Ember', 'Astral', 'Moonrise', 'Sunfire',

    // Additional creatures/beings
    'Condor', 'Crane', 'Heron', 'Jaguar', 'Lynx', 'Osprey', 'Panda', 'Pelican',
    'Sparrow', 'Stag', 'Swan', 'Tern', 'Viper', 'Wren', 'Bison', 'Elk'
];

/**
 * Get a random word from the word list
 * Uses Math.random() to select a random word from WORD_LIST array.
 * @returns {string} A random English word
 */
function getRandomWord() {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

/**
 * Generate a unique two-word level name by combining two different random words.
 * The two words are joined with a space (e.g., "Crimson Valley", "Midnight Forest").
 * @returns {string} A two-word level name
 */
function generateLevelName() {
    const wordCount = WORD_LIST.length;
    const firstIndex = Math.floor(Math.random() * wordCount);
    let secondIndex = Math.floor(Math.random() * (wordCount - 1));
    if (secondIndex >= firstIndex) secondIndex++;
    return WORD_LIST[firstIndex] + ' ' + WORD_LIST[secondIndex];
}

/**
 * Get the total number of words in the word list
 * @returns {number} The total count of words in WORD_LIST
 */
function getWordCount() {
    return WORD_LIST.length;
}

/**
 * Get a word at a specific index from the word list
 * @param {number} index - The index of the word to retrieve
 * @returns {string|undefined} The word at the specified index, or undefined if out of bounds
 */
function getWordAtIndex(index) {
    return WORD_LIST[index];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORD_LIST, getRandomWord, getWordCount, getWordAtIndex, generateLevelName };
}
