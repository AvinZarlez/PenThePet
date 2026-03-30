/**
 * Constants
 *
 * Centralized constants for game parameters and limits.
 */

const CONSTANTS = {
    // Repository URL — update here if the repo ever moves
    REPO_URL: 'https://github.com/AvinZarlez/penthepet',

    // Wall configuration
    MAX_WALLS: 12,              // Absolute maximum walls (for largest grid sizes)

    /**
     * Max walls for a given grid size: floor(size × 0.75).
     * Examples: 9×9→6, 11×11→8, 13×13→9, 17×17→12
     * @param {number} size @returns {number}
     */
    maxWallsForSize: function(size) {
        return Math.floor(size * 0.75);
    },

    // Grid configuration
    MAX_GRID_SIZE: 17,          // Maximum grid size (17x17)
    MIN_GRID_SIZE: 9,           // Minimum grid size (9x9)
    DEFAULT_GRID_SIZE: 9,       // Default grid size (9x9)

    // Map data
    FIRST_MAP_YEAR: 2026,          // First year that has map data files in maps/
    LIVE_GAME_URL: 'https://avinzarlez.com/penthepet',

    // Map generation
    MAX_GENERATION_ATTEMPTS: 100,  // Inner-loop attempts per outer retry (outer limit is 1000 in generate())
    WEAK_HOLE_THRESHOLD: 4,        // Holes must force a detour of more than this many steps

    // Tile distribution (probabilities should sum to 1.0)
    TILE_DISTRIBUTION: {
        grass: 0.7,             // 70% chance of grass tiles
        water: 0.3,             // 30% chance of water tiles
    },

    // Cell visual settings
    CELL: {
        GAP: 3,                 // Gap between cells in pixels (normal screens)
        GAP_SMALL: 1,           // Gap between cells in pixels (small screens)
        GAP_BREAKPOINT: 640,    // Screen width in pixels below which the small gap is used
        MIN_SIZE: 6,            // Minimum cell size in pixels (for very large grids on mobile)
        MAX_SIZE: 50,           // Maximum cell size in pixels (desktop)
    },

    // Grid sizing
    GRID_PADDING: 6,            // Padding around the grid in pixels

    // Local level editor
    LEVEL_EDITOR: {
        DEFAULT_PORT: 8787,
        AUTOSAVE_INTERVAL_MS: 30000,
        AUTOSAVE_COOKIE_DAYS: 365,
        AUTOSAVE_COOKIE_KEY: 'level_editor_draft',
        MAX_REQUEST_BODY_BYTES: 3 * 1024 * 1024,
        DEFAULT_LEVEL_NAME: 'Custom Level',
    },

    // Gameplay
    ALLOW_WALL_REMOVAL: true,   // Allow clicking walls to remove them
    AUTO_SAVE_STATE: false,     // Auto-save game state to localStorage

    // Hints
    HINTS_DISABLED_DEFAULT: false,          // Default: hints are enabled
    HINTS_NEVER_SHOW_TARGET_DEFAULT: true,  // Default: target score is not revealed

    // Hint type identifiers (stored in the hintsUsed array per level)
    HINT_CHECKED: 'checked',       // User pressed "Check if Optimal"
    HINT_TARGET: 'target',         // User pressed "Reveal Target"

    // UI timings
    SHARE_BUTTON_FLASH_MS: 2000,      // How long the "Copied!" label shows on the share button (ms)
    PENNED_ANIMATION_DELAY_MS: 50,    // Delay between BFS wave steps in the penned-area animation (ms)
    PAW_ANIMATION_DELAY_MS: 200,       // Delay between each paw step in the escape-path animation (ms)
    PAW_FADE_OUT_DELAY_MS: 600,      // How long each paw stays visible before it starts to fade out (ms)
    PAW_FADE_OUT_DURATION_MS: 400,    // Duration of each paw's fade-out animation (ms)
    SCORE_POPUP_DURATION_MS: 1800,    // Duration of score modifier popup float animation (ms)
    TILE_TOOLTIP_DURATION_MS: 2500,   // Duration of tile tooltip thought bubble float animation (ms)
    PET_WANDER_STEP_MS: 600,          // Delay between each pet wander step when penned (ms)
    PET_RETURN_STEP_MS: 150,          // Delay between each step when pet walks home (ms)

    // Timezone
    DEFAULT_TIMEZONE: 'America/Los_Angeles',    // Default timezone (Pacific / California)

    // Timezone options for the user to select from
    TIMEZONE_OPTIONS: [
        { value: 'Pacific/Honolulu',      label: 'Hawaii (HST, UTC-10)'              },
        { value: 'America/Anchorage',     label: 'Alaska (AKST, UTC-9)'              },
        { value: 'America/Los_Angeles',   label: 'Pacific (PST/PDT, UTC-8/-7)'       },
        { value: 'America/Denver',        label: 'Mountain (MST/MDT, UTC-7/-6)'      },
        { value: 'America/Chicago',       label: 'Central (CST/CDT, UTC-6/-5)'       },
        { value: 'America/New_York',      label: 'Eastern (EST/EDT, UTC-5/-4)'       },
        { value: 'America/Sao_Paulo',     label: 'Brasilia (BRT, UTC-3)'             },
        { value: 'Europe/London',         label: 'London (GMT/BST, UTC+0/+1)'        },
        { value: 'Europe/Paris',          label: 'Central Europe (CET/CEST, UTC+1/+2)' },
        { value: 'Europe/Helsinki',       label: 'Eastern Europe (EET/EEST, UTC+2/+3)' },
        { value: 'Europe/Moscow',         label: 'Moscow (MSK, UTC+3)'               },
        { value: 'Asia/Dubai',            label: 'Gulf (GST, UTC+4)'                 },
        { value: 'Asia/Karachi',          label: 'Pakistan (PKT, UTC+5)'             },
        { value: 'Asia/Kolkata',          label: 'India (IST, UTC+5:30)'             },
        { value: 'Asia/Dhaka',            label: 'Bangladesh (BST, UTC+6)'           },
        { value: 'Asia/Bangkok',          label: 'Indochina (ICT, UTC+7)'            },
        { value: 'Asia/Shanghai',         label: 'China (CST, UTC+8)'                },
        { value: 'Asia/Tokyo',            label: 'Japan (JST, UTC+9)'                },
        { value: 'Australia/Sydney',      label: 'Australia Eastern (AEST, UTC+10)'  },
        { value: 'Pacific/Auckland',      label: 'New Zealand (NZST, UTC+12)'        },
    ],

    // Cloud sync caching
    /**
     * Seconds after a successful sync during which subsequent syncNow() calls
     * skip the full Firestore download and use local cookies instead.
     * The realtime listener keeps data current; this avoids redundant network
     * round-trips when the user rapidly opens/closes the level selector.
     * Set to 0 to disable caching (always fetch from cloud).
     */
    CLOUD_SYNC_CACHE_TTL_SECONDS: 300,

    // Level selector UI text
    LEVEL_SELECTOR_LOADING_TEXT: 'Loading...',
    LEVEL_SELECTOR_SYNC_STATUS_UNKNOWN: '???',

    // Animal options for pet selection
    ANIMAL_OPTIONS: [
        { emoji: '🐶', name: 'Dog Face' },
        { emoji: '🐱', name: 'Cat Face' },
        { emoji: '🐰', name: 'Rabbit' },
        { emoji: '🐹', name: 'Hamster' },
        { emoji: '🐀', name: 'Rat' },
        { emoji: '🐇', name: 'Hare' },
        { emoji: '🐕‍🦺', name: 'Service Dog' },
        { emoji: '🐦', name: 'Bird' },
        { emoji: '🐢', name: 'Turtle' },
        { emoji: '🐍', name: 'Snake' },
        { emoji: '🐟', name: 'Fish' },
        { emoji: '🐠', name: 'Tropical Fish' },
        { emoji: '🕷️', name: 'Spider' },
        { emoji: '🐈‍⬛', name: 'Black Cat' },
        { emoji: '🦜', name: 'Parrot' },
        { emoji: '🐕', name: 'Dog' },
        { emoji: '🐩', name: 'Poodle' },
        { emoji: '🦎', name: 'Lizard' },
        { emoji: '🦮', name: 'Guide Dog' },
        { emoji: '🐈', name: 'Cat' },
        { emoji: '🐴', name: 'Horse Face' },
        { emoji: '🐎', name: 'Horse' },
        { emoji: '🐭', name: 'Mouse Face' },
        { emoji: '🐁', name: 'Mouse' },
        { emoji: '🐿️', name: 'Squirrel' },
        { emoji: '🪨', name: 'Rock' },
        { emoji: '🐉', name: 'Dragon'}
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
