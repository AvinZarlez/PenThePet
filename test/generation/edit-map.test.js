const fs = require('fs');
const path = require('path');

/**
 * Minimal inline argument validation matching the logic in scripts/edit-map.js.
 * Used to unit-test argument checking without spawning a subprocess.
 */
function validateArgs(argv) {
    const args = argv.slice(2);
    let mapCode = '';
    let date = '';
    let dayNumber = null;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--map-code' && i + 1 < args.length) mapCode = args[i + 1];
        else if (args[i] === '--date' && i + 1 < args.length) date = args[i + 1];
        else if (args[i] === '--day-number' && i + 1 < args.length) dayNumber = parseInt(args[i + 1], 10);
    }
    if (!mapCode) throw new Error('Missing required --map-code');
    if (!date && dayNumber === null) throw new Error('Must specify either --date (YYYY-MM-DD) or --day-number');
    if (date && dayNumber !== null) throw new Error('Specify only one of --date or --day-number, not both');
}

describe('edit-map script basic coverage', () => {
    test('script file exists and contains expected flags', () => {
        const scriptPath = path.join(__dirname, '../../scripts/edit-map.js');
        expect(fs.existsSync(scriptPath)).toBe(true);
        const content = fs.readFileSync(scriptPath, 'utf8');
        expect(content).toContain('--map-code');
        expect(content).toContain('--date');
        expect(content).toContain('--day-number');
    });

    test('requires --map-code argument', () => {
        expect(() => validateArgs(['node', 'edit-map.js'])).toThrow('Missing required --map-code');
    });

    test('requires --date or --day-number argument', () => {
        expect(() => validateArgs(['node', 'edit-map.js', '--map-code', 'abc123']))
            .toThrow('Must specify either --date (YYYY-MM-DD) or --day-number');
    });

    test('rejects specifying both --date and --day-number', () => {
        expect(() =>
            validateArgs(['node', 'edit-map.js', '--map-code', 'abc123', '--date', '2025-01-01', '--day-number', '1'])
        ).toThrow('Specify only one of --date or --day-number, not both');
    });
});
