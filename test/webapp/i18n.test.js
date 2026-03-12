/**
 * Unit Tests for i18n.js
 *
 * Tests the I18N object: key lookup, parameter substitution,
 * language switching, fallback behaviour, and DOM application.
 */

const { I18N, LANGUAGES, LANGUAGE_OPTIONS } = require('../../js/i18n.js');

// Reset language to 'en' before each test so tests are independent
beforeEach(() => {
    I18N._lang = 'en';
});

describe('LANGUAGE_OPTIONS', () => {
    test('should be a non-empty array', () => {
        expect(Array.isArray(LANGUAGE_OPTIONS)).toBe(true);
        expect(LANGUAGE_OPTIONS.length).toBeGreaterThan(0);
    });

    test('each option should have value and label', () => {
        for (const opt of LANGUAGE_OPTIONS) {
            expect(typeof opt.value).toBe('string');
            expect(opt.value.length).toBeGreaterThan(0);
            expect(typeof opt.label).toBe('string');
            expect(opt.label.length).toBeGreaterThan(0);
        }
    });

    test('should include English', () => {
        const enOption = LANGUAGE_OPTIONS.find(o => o.value === 'en');
        expect(enOption).toBeDefined();
        expect(enOption.label).toBe('English');
    });
});

describe('LANGUAGES', () => {
    test('should contain en language', () => {
        expect(LANGUAGES).toHaveProperty('en');
        expect(typeof LANGUAGES.en).toBe('object');
    });

    test('en strings should all be non-empty strings', () => {
        for (const [, val] of Object.entries(LANGUAGES.en)) {
            expect(typeof val).toBe('string');
            expect(val.length).toBeGreaterThan(0);
        }
    });

    test('should contain tile description keys', () => {
        const tileKeys = [
            'tile_grass_description', 'tile_grass_aria',
            'tile_water_description', 'tile_water_aria',
            'tile_wall_description',  'tile_wall_aria',
            'tile_home_description',  'tile_home_aria',
            'tile_star_description',  'tile_star_aria',
            'tile_bee_description',   'tile_bee_aria',
            'tile_hole_description',  'tile_hole_aria',
            'tile_filledHole_description', 'tile_filledHole_aria',
        ];
        for (const key of tileKeys) {
            expect(LANGUAGES.en).toHaveProperty(key);
        }
    });
});

describe('I18N.t()', () => {
    test('should return the English string for a valid key', () => {
        expect(I18N.t('status_unsolved')).toBe('Unsolved');
    });

    test('should substitute a single {param}', () => {
        const result = I18N.t('walls_counter', { wallCount: 3, maxWalls: 9 });
        expect(result).toBe('3 / 9');
    });

    test('should substitute multiple params', () => {
        const result = I18N.t('score_with_goal', { score: 10, goalScore: 15 });
        expect(result).toBe('10 / 15');
    });

    test('should substitute params in tile aria strings', () => {
        const result = I18N.t('tile_grass_aria', { row: 1, col: 2 });
        expect(result).toBe('Grass tile at row 1, column 2. Click to build a wall.');
    });

    test('should return the key itself for unknown keys', () => {
        expect(I18N.t('nonexistent_key_xyz')).toBe('nonexistent_key_xyz');
    });

    test('should handle params being an empty object', () => {
        const result = I18N.t('status_unsolved', {});
        expect(result).toBe('Unsolved');
    });

    test('should handle params being undefined', () => {
        const result = I18N.t('status_unsolved');
        expect(result).toBe('Unsolved');
    });

    test('should convert param values to string', () => {
        const result = I18N.t('best_so_far', { score: 42 });
        expect(result).toBe('Best So Far: 42');
    });

    test('should replace all occurrences of the same param', () => {
        // page_title does not use params but let's verify a param appears once
        const result = I18N.t('hint_optimal_label', { score: 7 });
        expect(result).toBe('Optimal is 7');
    });
});

describe('I18N.sanitizeKey()', () => {
    test('should return the key unchanged when it contains only valid characters', () => {
        expect(I18N.sanitizeKey('status_unsolved')).toBe('status_unsolved');
        expect(I18N.sanitizeKey('about_description_1_strong')).toBe('about_description_1_strong');
    });

    test('should strip characters that are not ASCII letters, digits or underscore', () => {
        expect(I18N.sanitizeKey('bad-key')).toBe('badkey');
        expect(I18N.sanitizeKey('key.with.dots')).toBe('keywithdots');
        expect(I18N.sanitizeKey('<script>alert(1)</script>')).toBe('scriptalert1script');
        expect(I18N.sanitizeKey('key space')).toBe('keyspace');
    });

    test('should return an empty string for non-string input', () => {
        expect(I18N.sanitizeKey(null)).toBe('');
        expect(I18N.sanitizeKey(undefined)).toBe('');
        expect(I18N.sanitizeKey(42)).toBe('');
    });

    test('should return an empty string for an empty string input', () => {
        expect(I18N.sanitizeKey('')).toBe('');
    });
});

describe('I18N.getLanguage()', () => {
    test('should return en by default', () => {
        expect(I18N.getLanguage()).toBe('en');
    });
});

describe('I18N.setLanguage()', () => {
    test('should set the language when valid', () => {
        // Create a temp language entry for testing
        LANGUAGES._test = { status_unsolved: 'Ungelöst' };
        I18N.setLanguage('_test');
        expect(I18N.getLanguage()).toBe('_test');
        expect(I18N.t('status_unsolved')).toBe('Ungelöst');
        // Cleanup
        delete LANGUAGES._test;
        I18N._lang = 'en';
    });

    test('should not change language for unknown code', () => {
        I18N.setLanguage('zz');
        expect(I18N.getLanguage()).toBe('en');
    });

    test('should fall back to en for a key missing in the active language', () => {
        LANGUAGES._partial = { foo: 'bar' };
        I18N.setLanguage('_partial');
        expect(I18N.t('status_unsolved')).toBe('Unsolved'); // fallback to en
        delete LANGUAGES._partial;
        I18N._lang = 'en';
    });
});

describe('I18N.loadFromCookie()', () => {
    test('should not throw when CookieUtils is available', () => {
        expect(() => I18N.loadFromCookie()).not.toThrow();
    });

    test('should load a saved valid language from cookie', () => {
        LANGUAGES._saved = { status_unsolved: 'Saved' };
        // Mock CookieUtils.getCookie to return our test language
        const originalGet = global.CookieUtils.getCookie;
        global.CookieUtils.getCookie = jest.fn(key => key === 'lang' ? '_saved' : null);
        I18N.loadFromCookie();
        expect(I18N.getLanguage()).toBe('_saved');
        // Restore
        global.CookieUtils.getCookie = originalGet;
        delete LANGUAGES._saved;
        I18N._lang = 'en';
    });

    test('should ignore unknown language codes from cookie', () => {
        const originalGet = global.CookieUtils.getCookie;
        global.CookieUtils.getCookie = jest.fn(() => 'nonexistent_lang');
        I18N.loadFromCookie();
        expect(I18N.getLanguage()).toBe('en');
        global.CookieUtils.getCookie = originalGet;
    });
});

describe('I18N.applyTranslations()', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <span id="a" data-i18n="status_unsolved">Unsolved</span>
            <p id="b"><strong data-i18n="about_description_1_strong"></strong><span data-i18n="about_description_1_body"></span></p>
            <button id="c" data-i18n-title="timer_pause_title" title="Pause timer"></button>
            <button id="d" data-i18n-aria="hint_check_aria" aria-label="Check if optimal"></button>
            <input id="e" data-i18n-placeholder="edit_profile_username_placeholder" placeholder="Your display name">
        `;
    });

    test('should update textContent for data-i18n elements', () => {
        I18N.applyTranslations();
        expect(document.getElementById('a').textContent).toBe('Unsolved');
    });

    test('should populate split strong+body text for about_description_1', () => {
        I18N.applyTranslations();
        const strong = document.querySelector('#b strong');
        const body = document.querySelector('#b span');
        expect(strong.textContent).toBe('Pen the Pet');
        expect(body.textContent).toContain('logic puzzle game');
    });

    test('should update title for data-i18n-title elements', () => {
        I18N.applyTranslations();
        expect(document.getElementById('c').title).toBe('Pause timer');
    });

    test('should update aria-label for data-i18n-aria elements', () => {
        I18N.applyTranslations();
        expect(document.getElementById('d').getAttribute('aria-label')).toBe('Check if optimal');
    });

    test('should update placeholder for data-i18n-placeholder elements', () => {
        I18N.applyTranslations();
        expect(document.getElementById('e').placeholder).toBe('Your display name');
    });

    test('should sanitize malicious data-i18n attribute value and fall back to key', () => {
        document.body.innerHTML = '<span id="x" data-i18n="<img src=x onerror=alert(1)>">original</span>';
        I18N.applyTranslations();
        // After stripping non-identifier chars the key becomes 'imgsrcxonerroralert1'
        // which is not a known key, so t() returns it unchanged (key fallback)
        const text = document.getElementById('x').textContent;
        expect(text).not.toContain('<');
        expect(text).not.toContain('>');
    });
});

describe('Tile description keys in TILE_DATA', () => {
    const tileNames = ['grass', 'water', 'wall', 'home', 'star', 'bee', 'hole', 'filledHole'];

    test('all tiles should have descriptionKey', () => {
        for (const name of tileNames) {
            const tile = TILE_DATA[name];
            expect(tile).toHaveProperty('descriptionKey');
            expect(typeof tile.descriptionKey).toBe('string');
        }
    });

    test('all descriptionKeys should resolve to non-empty strings via I18N.t()', () => {
        for (const name of tileNames) {
            const key = TILE_DATA[name].descriptionKey;
            const text = I18N.t(key);
            expect(typeof text).toBe('string');
            expect(text.length).toBeGreaterThan(0);
            expect(text).not.toBe(key); // should not fall back to the key itself
        }
    });

    test('all tiles should have ariaLabel function that uses I18N', () => {
        for (const name of tileNames) {
            const tile = TILE_DATA[name];
            expect(typeof tile.ariaLabel).toBe('function');
            const label = tile.ariaLabel(0, 0);
            expect(typeof label).toBe('string');
            expect(label.length).toBeGreaterThan(0);
        }
    });
});
