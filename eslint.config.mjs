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
                ...globals.node,
                ...globals.jest,
                // Custom globals from the original config
                CONFIG: 'readonly',
                CONSTANTS: 'readonly',
                TILE_TYPES: 'readonly',
                getTileType: 'readonly',
                Grid: 'readonly',
                Game: 'readonly',
                MapGenerator: 'readonly',
                MILPSolver: 'readonly',
                PathfindingUtils: 'readonly',
                getRandomWord: 'readonly',
                WORD_LIST: 'readonly'
            }
        },
        rules: {
            'indent': ['error', 4],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'],
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
            'no-console': 'off'
        }
    },
    {
        files: ['js/**/*.js', 'test/**/*.js', 'scripts/**/*.js']
    }
];
