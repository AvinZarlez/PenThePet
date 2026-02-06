/**
 * Word List
 * 
 * A collection of random English words for map naming.
 * These words are used to give each generated map a unique, memorable name.
 */

const WORD_LIST = [
    // Nature words
    "Meadow", "River", "Forest", "Mountain", "Ocean", "Desert", "Valley", "Canyon",
    "Prairie", "Tundra", "Glacier", "Lagoon", "Marsh", "Swamp", "Jungle", "Savanna",
    
    // Weather/Sky words
    "Thunder", "Lightning", "Storm", "Cloud", "Mist", "Fog", "Rainbow", "Sunset",
    "Sunrise", "Twilight", "Aurora", "Eclipse", "Meteor", "Comet", "Nebula", "Galaxy",
    
    // Animals
    "Eagle", "Falcon", "Hawk", "Raven", "Phoenix", "Dragon", "Tiger", "Lion",
    "Bear", "Wolf", "Fox", "Deer", "Rabbit", "Dolphin", "Whale", "Shark",
    
    // Colors
    "Crimson", "Azure", "Emerald", "Amber", "Violet", "Indigo", "Scarlet", "Cobalt",
    "Jade", "Ruby", "Sapphire", "Topaz", "Pearl", "Ivory", "Onyx", "Silver",
    
    // Abstract concepts
    "Harmony", "Serenity", "Tranquil", "Mystic", "Enigma", "Paradox", "Infinity", "Eternity",
    "Cascade", "Horizon", "Zenith", "Vertex", "Apex", "Pinnacle", "Summit", "Peak",
    
    // Elements/Materials
    "Crystal", "Diamond", "Steel", "Bronze", "Iron", "Gold", "Copper", "Marble",
    "Granite", "Quartz", "Obsidian", "Coral", "Amber", "Slate", "Flint", "Stone",
    
    // Time periods
    "Dawn", "Dusk", "Noon", "Midnight", "Autumn", "Spring", "Summer", "Winter",
    "Solstice", "Equinox", "Century", "Millennium", "Era", "Epoch", "Eon", "Age",
    
    // Directions/Positions
    "North", "South", "East", "West", "Zenith", "Nadir", "Frontier", "Border",
    "Edge", "Core", "Center", "Periphery", "Margin", "Boundary", "Limit", "Threshold",
    
    // Mythological/Fantasy
    "Olympus", "Valhalla", "Avalon", "Atlantis", "Utopia", "Arcadia", "Elysium", "Camelot",
    "Asgard", "Sanctuary", "Haven", "Refuge", "Citadel", "Fortress", "Bastion", "Stronghold",
    
    // Natural phenomena
    "Cascade", "Torrent", "Geyser", "Volcano", "Quake", "Avalanche", "Blizzard", "Hurricane",
    "Typhoon", "Cyclone", "Tempest", "Maelstrom", "Whirlpool", "Rapids", "Falls", "Cataract",
    
    // Terrain features
    "Plateau", "Mesa", "Butte", "Ridge", "Gorge", "Ravine", "Cliff", "Crag",
    "Summit", "Crest", "Knoll", "Hillock", "Mound", "Dune", "Outcrop", "Bluff"
];

/**
 * Get a random word from the word list
 * @returns {string} A random English word
 */
function getRandomWord() {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORD_LIST, getRandomWord };
}
