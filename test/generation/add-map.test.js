const fs = require('fs');
const path = require('path');

const { buildPlayableUrl } = require('../../scripts/lib/levelEditorMap.js');

describe('add-map script basic coverage', () => {
    test('script file exists and is executable JS', () => {
        const scriptPath = path.join(__dirname, '../../scripts/add-map.js');
        expect(fs.existsSync(scriptPath)).toBe(true);
        const content = fs.readFileSync(scriptPath, 'utf8');
        expect(content).toContain('--map-code');
    });

    test('level editor URL helper remains stable', () => {
        expect(buildPlayableUrl('xyz')).toBe('https://avinzarlez.com/penthepet?map=xyz');
    });
});
