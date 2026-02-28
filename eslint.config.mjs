import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                ...globals.jest,
                // Custom globals
                CookieUtils: 'readonly',
                DateUtils: 'readonly',
                CONFIG: 'readonly',
                CONSTANTS: 'readonly',
                TILE_TYPES: 'readonly',
                getTileType: 'readonly',
                Grid: 'readonly',
                Game: 'readonly',
                CloudSync: 'readonly',
                FIREBASE_CONFIG: 'readonly',
                firebase: 'readonly',
                MapGenerator: 'readonly',
                MapValidator: 'readonly',
                MILPSolver: 'readonly',
                PathfindingUtils: 'readonly',
                getRandomWord: 'readonly',
                WORD_LIST: 'readonly',
                updateMapInfo: 'readonly',
            },
        },
        rules: {
            'indent': ['error', 4],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
        },
    },
];
