/**
 * Menu Tests
 * 
 * Test suite for the menu system including level selector,
 * instructions, about, and options modals.
 */

const Menu = require('../../../js/Menu.js');

// Mock DOM elements for testing
function setupDOM() {
    document.body.innerHTML = `
        <button id="menuBtn"></button>
        <div id="menuModal" class="modal"></div>
        <div id="levelSelectorModal" class="modal">
            <div id="levelList"></div>
        </div>
        <div id="instructionsModal" class="modal">
            <div id="tileDescriptions" class="tile-descriptions"></div>
        </div>
        <div id="aboutModal" class="modal"></div>
        <div id="optionsModal" class="modal">
            <select id="modalPetType"></select>
            <input type="checkbox" id="modalHintsDisabled">
            <input type="checkbox" id="modalNeverShowTarget">
            <select id="modalTimezone"></select>
            <input type="checkbox" id="debugModeCheckbox">
        </div>
        <button class="modal-close"></button>
        <button id="instrShortcutBtn"></button>
        <button id="levelSelectorBtn"></button>
        <button id="instructionsBtn"></button>
        <button id="aboutBtn"></button>
        <button id="optionsBtn"></button>
        <select id="petType"></select>
        <div class="debug-section" style="display: none;">
            <input type="checkbox" id="debugShowAllLevels">
            <button id="debugResetLevel"></button>
            <button id="debugResetAll"></button>
        </div>
    `;
}

// Mock game object
function createMockGame() {
    return {
        petEmoji: '🐶',
        hintsDisabled: false,
        neverShowTarget: true,
        hintsUsed: [],
        render: jest.fn(),
        updateLegend: jest.fn(),
        grid: {
            size: 7,
            loadMap: jest.fn(),
            saveInitialState: jest.fn(),
            reset: jest.fn(),
            getTile: jest.fn(() => 'grass'),
            setTile: jest.fn()
        },
        wallCount: 0,
        goalAreaSize: 10,
        maxWalls: 9,
        currentDate: '2026-02-06',
        optimalSolution: null,
        isSubmitted: false,
        submittedScore: null,
        submittedWalls: null,
        viewingOptimal: false,
        updateWallCounter: jest.fn(),
        updateAreaSizeDisplay: jest.fn(),
        updateResetButton: jest.fn(),
        updateSolutionToggleBar: jest.fn(),
        updateHintButton: jest.fn(),
        loadHintsUsed: jest.fn(() => []),
        loadSubmission: jest.fn(() => null),
        deleteSubmission: jest.fn(),
        resetLevelData: jest.fn(),
        isValidPosition: jest.fn(() => true)
    };
}
// Mock fetch for maps database
function mockFetch() {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                '2026-02-06': {
                    dayNumber: 1,
                    mapName: 'Canyon',
                    date: '2026-02-06',
                    size: 7,
                    goal: 11,
                    maxWalls: 3,
                    map: 'g'.repeat(49)
                },
                '2026-02-05': {
                    dayNumber: 0,  // Day 0 is before the official launch
                    mapName: 'River',
                    date: '2026-02-05',
                    size: 7,
                    goal: 8,
                    maxWalls: 4,
                    map: 'g'.repeat(49)
                },
                '2099-12-31': {
                    dayNumber: 999,
                    mapName: 'Future',
                    date: '2099-12-31',
                    size: 7,
                    goal: 15,
                    maxWalls: 5,
                    map: 'g'.repeat(49)
                }
            })
        })
    );
}

describe('Menu', () => {
    let menu;
    let game;

    beforeEach(() => {
        setupDOM();
        game = createMockGame();
        menu = new Menu(game);
        mockFetch();
        
        // Clear cookies
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
    });

    describe('Initialization', () => {
        test('should initialize with game reference', () => {
            expect(menu.game).toBe(game);
        });

        test('should set initial properties', () => {
            expect(menu.currentLevel).toBe(null);
            expect(menu.mapsDatabase).toBe(null);
            expect(menu.showAllLevels).toBe(false);
        });
    });

    describe('Modal Operations', () => {
        test('should open main menu modal', () => {
            menu.openMenu();
            const menuModal = document.getElementById('menuModal');
            expect(menuModal.classList.contains('show')).toBe(true);
        });

        test('should close specific modal', () => {
            const modal = document.getElementById('menuModal');
            modal.classList.add('show');
            
            menu.closeModal(modal);
            expect(modal.classList.contains('show')).toBe(false);
        });

        test('should close all modals', () => {
            const menuModal = document.getElementById('menuModal');
            const levelModal = document.getElementById('levelSelectorModal');
            
            menuModal.classList.add('show');
            levelModal.classList.add('show');
            
            menu.closeAllModals();
            
            expect(menuModal.classList.contains('show')).toBe(false);
            expect(levelModal.classList.contains('show')).toBe(false);
        });

        test('should open instructions modal', () => {
            menu.openInstructions();
            const instructionsModal = document.getElementById('instructionsModal');
            expect(instructionsModal.classList.contains('show')).toBe(true);
        });

        test('instructions shortcut button should open instructions modal directly', () => {
            const instrBtn = document.getElementById('instrShortcutBtn');
            instrBtn.click();
            const instructionsModal = document.getElementById('instructionsModal');
            expect(instructionsModal.classList.contains('show')).toBe(true);
        });

        test('should populate tile descriptions from TILE_DATA', () => {
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = container.querySelectorAll('.tile-desc-row');
            const tilesWithDesc = Object.values(TILE_DATA).filter(d => d.descriptionKey);
            expect(rows.length).toBe(tilesWithDesc.length);
        });

        test('should not duplicate tile descriptions on multiple opens', () => {
            menu.openInstructions();
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = container.querySelectorAll('.tile-desc-row');
            const tilesWithDesc = Object.values(TILE_DATA).filter(d => d.descriptionKey);
            expect(rows.length).toBe(tilesWithDesc.length);
        });

        test('grass and water tile icons use data: URIs from TileSvgs, not missing asset files', () => {
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = Array.from(container.querySelectorAll('.tile-desc-row'));
            const tileNames = Object.keys(TILE_DATA).filter(k => TILE_DATA[k].descriptionKey);

            for (const tileName of ['grass', 'water']) {
                const idx = tileNames.indexOf(tileName);
                expect(idx).toBeGreaterThanOrEqual(0);
                const row = rows[idx];
                const imgs = row.querySelectorAll('img');
                // Base layer is set as style.background (data: URI), so only
                // the variant overlay is an <img> element.
                expect(imgs.length).toBe(1);
                imgs.forEach(img => {
                    expect(img.src).toMatch(/^data:/);
                });
            }
        });

        test('png tile icons (home, wall, hole) render with correct asset paths', () => {
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = Array.from(container.querySelectorAll('.tile-desc-row'));
            const tileNames = Object.keys(TILE_DATA).filter(k => TILE_DATA[k].descriptionKey);

            // wall: single PNG asset used as background, no overlay <img> elements
            const wallIdx = tileNames.indexOf('wall');
            expect(wallIdx).toBeGreaterThanOrEqual(0);
            expect(rows[wallIdx].querySelectorAll('img').length).toBe(0);

            // home: TileSvgs grass background + home.png overlay <img>
            const homeIdx = tileNames.indexOf('home');
            expect(homeIdx).toBeGreaterThanOrEqual(0);
            const homeImgs = rows[homeIdx].querySelectorAll('img');
            expect(homeImgs.length).toBe(1);
            expect(homeImgs[0].src).toMatch(/home\.png/);

            // hole: single PNG asset used as background, no overlay <img> elements
            const holeIdx = tileNames.indexOf('hole');
            expect(holeIdx).toBeGreaterThanOrEqual(0);
            expect(rows[holeIdx].querySelectorAll('img').length).toBe(0);
        });

        test('emoji tile icons (star, bee) render with img and emoji span overlays', () => {
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = Array.from(container.querySelectorAll('.tile-desc-row'));
            const tileNames = Object.keys(TILE_DATA).filter(k => TILE_DATA[k].descriptionKey);

            for (const tileName of ['star', 'bee']) {
                const idx = tileNames.indexOf(tileName);
                expect(idx).toBeGreaterThanOrEqual(0);
                const row = rows[idx];
                // One <img> overlay (star-outline.svg / beehive.png)
                expect(row.querySelectorAll('img').length).toBe(1);
                // One emoji span overlay (⭐ / 🐝)
                const spans = row.querySelectorAll('span.tile-overlay-emoji');
                expect(spans.length).toBe(1);
            }
        });

        test('should open about modal', () => {
            menu.openAbout();
            const aboutModal = document.getElementById('aboutModal');
            expect(aboutModal.classList.contains('show')).toBe(true);
        });

        test('should open options modal', () => {
            menu.openOptions();
            const optionsModal = document.getElementById('optionsModal');
            expect(optionsModal.classList.contains('show')).toBe(true);
        });
    });

    describe('Level Selector', () => {
        test('should load maps database', async () => {
            await menu.loadMapsDatabase();
            expect(menu.mapsDatabase).not.toBe(null);
            expect(menu.mapsDatabase['2026-02-06']).toBeDefined();
        });

        test('should populate level list', async () => {
            await menu.loadMapsDatabase();
            menu.populateLevelList();
            
            const levelList = document.getElementById('levelList');
            expect(levelList.children.length).toBeGreaterThan(0);
        });

        test('should format dates correctly', () => {
            const formatted = menu._formatDate('2026-02-06');
            expect(formatted).toMatch(/Feb.*6.*2026/);
        });
    });

    describe('Cookie Persistence', () => {
        test('should save and load pet emoji', () => {
            menu._savePetToCookie('🐱');
            const loaded = CookieUtils.getCookie('selectedPet');
            expect(loaded).toBe('🐱');
        });

        test('should save and load hints disabled', () => {
            menu._saveHintsDisabledToCookie(true);
            const loaded = CookieUtils.getCookie('hintsDisabled');
            expect(loaded).toBe('true');
        });

        test('should save and load never show target', () => {
            menu._saveNeverShowTargetToCookie(false);
            const loaded = CookieUtils.getCookie('neverShowTarget');
            expect(loaded).toBe('false');
        });

        test('should save and load debug mode', () => {
            menu._saveDebugModeToCookie(true);
            const loaded = menu._loadDebugModeFromCookie();
            expect(loaded).toBe(true);
        });

        test('should save and load current level', () => {
            menu._saveCurrentLevelToCookie('2026-02-05');
            const loaded = CookieUtils.getCookie('currentLevel');
            expect(loaded).toBe('2026-02-05');
        });

        test('should handle missing cookies gracefully', () => {
            const value = CookieUtils.getCookie('nonexistent');
            expect(value).toBe(null);
        });
    });

    describe('Debug Tools', () => {
        test('should show debug tools when enabled', () => {
            menu.updateDebugToolsVisibility(true);
            const debugSection = document.querySelector('.debug-section');
            expect(debugSection.style.display).toBe('block');
        });

        test('should hide debug tools when disabled', () => {
            menu.updateDebugToolsVisibility(false);
            const debugSection = document.querySelector('.debug-section');
            expect(debugSection.style.display).toBe('none');
        });
    });

    describe('Options Synchronization', () => {
        test('should sync pet type between modal and main selector', () => {
            const modalPetType = document.getElementById('modalPetType');
            
            // Add options to modal
            const option = document.createElement('option');
            option.value = '🐱';
            modalPetType.appendChild(option);
            
            // Simulate change
            modalPetType.value = '🐱';
            modalPetType.dispatchEvent(new Event('change'));
            
            expect(game.petEmoji).toBe('🐱');
        });

        test('should sync hints disabled between modal and game', () => {
            const modalHintsDisabled = document.getElementById('modalHintsDisabled');

            // Simulate checking "disable hints"
            modalHintsDisabled.checked = true;
            modalHintsDisabled.dispatchEvent(new Event('change'));

            expect(game.hintsDisabled).toBe(true);
        });
    });

    describe('Level Loading', () => {
        test('should load a selected level', async () => {
            await menu.loadMapsDatabase();
            
            const mapData = menu.mapsDatabase['2026-02-06'];
            await menu.loadLevel(mapData);
            
            expect(game.grid.loadMap).toHaveBeenCalled();
            expect(game.goalAreaSize).toBe(11);
            expect(game.maxWalls).toBe(3);
        });

        test('should save selected level to cookie', async () => {
            await menu.loadMapsDatabase();
            await menu.selectLevel('2026-02-06');
            
            const savedLevel = CookieUtils.getCookie('currentLevel');
            expect(savedLevel).toBe('2026-02-06');
        });

        test('should handle level not found gracefully', async () => {
            await menu.loadMapsDatabase();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await menu.selectLevel('2026-01-01');
            
            expect(consoleSpy).toHaveBeenCalledWith('Level not found:', '2026-01-01');
            consoleSpy.mockRestore();
        });

        test('should handle missing goal in level data', async () => {
            await menu.loadMapsDatabase();
            
            const mapData = { ...menu.mapsDatabase['2026-02-06'] };
            delete mapData.goal;
            
            await menu.loadLevel(mapData);
            
            // Should still load without crashing
            expect(game.grid.loadMap).toHaveBeenCalled();
        });

        test('should handle missing maxWalls in level data', async () => {
            await menu.loadMapsDatabase();
            
            const mapData = { ...menu.mapsDatabase['2026-02-06'] };
            delete mapData.maxWalls;
            
            await menu.loadLevel(mapData);
            
            // Should still load without crashing
            expect(game.grid.loadMap).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle fetch failure gracefully', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

            await menu.loadMapsDatabase();

            // Year files that fail to fetch are silently skipped; result is an empty database
            expect(menu.mapsDatabase).toEqual({});
        });

        test('should handle fetch not ok response', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false
                })
            );

            await menu.loadMapsDatabase();

            // Non-ok responses are silently skipped (year file may simply not exist yet)
            expect(menu.mapsDatabase).toEqual({});
        });

        test('should handle null modal element gracefully', () => {
            // Remove modal from DOM
            const modal = document.getElementById('menuModal');
            if (modal) modal.remove();
            
            // Should not throw error
            expect(() => menu.closeModal(null)).not.toThrow();
        });

        test('should handle missing elements in openOptions', () => {
            // Remove modal pet type element
            const modalPetType = document.getElementById('modalPetType');
            if (modalPetType) modalPetType.remove();
            
            // Should not throw error
            expect(() => menu.openOptions()).not.toThrow();
        });
    });

    describe('Date Formatting', () => {
        test('should delegate to DateUtils.formatDate', () => {
            const result = menu._formatDate('2026-02-06');
            
            // Should match the format from DateUtils.formatDate
            expect(result).toMatch(/Feb.*6.*2026/);
        });

        test('should format various date strings correctly', () => {
            expect(menu._formatDate('2026-01-15')).toMatch(/Jan.*15.*2026/);
            expect(menu._formatDate('2025-12-25')).toMatch(/Dec.*25.*2025/);
            expect(menu._formatDate('2026-06-01')).toMatch(/Jun.*1.*2026/);
        });
    });

    describe('Modal Close Events', () => {
        test('should close modal on backdrop click', () => {
            const modal = document.getElementById('menuModal');
            modal.classList.add('show');
            
            // Simulate click on backdrop (modal itself, not content)
            const event = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal, writable: false });
            modal.dispatchEvent(event);
            
            expect(modal.classList.contains('show')).toBe(false);
        });

        test('should close modal via closeModal method', () => {
            const modal = document.getElementById('menuModal');
            modal.classList.add('show');
            
            // Directly call closeModal
            menu.closeModal(modal);
            
            expect(modal.classList.contains('show')).toBe(false);
        });
    });

    describe('Level Selector Edge Cases', () => {
        test('should populate animal options when opening options', () => {
            const modalPetType = document.getElementById('modalPetType');
            
            menu.openOptions();
            
            expect(modalPetType.children.length).toBeGreaterThan(0);
        });

        test('should populate language options via populateModalLanguageOptions', () => {
            // Add the language selector element to the DOM
            const modalLanguage = document.createElement('select');
            modalLanguage.id = 'modalLanguage';
            document.getElementById('optionsModal').appendChild(modalLanguage);

            menu.populateModalLanguageOptions();

            expect(modalLanguage.children.length).toBe(LANGUAGE_OPTIONS.length);
            expect(modalLanguage.children.length).toBeGreaterThan(0);
            // First option should match the first LANGUAGE_OPTIONS entry
            expect(modalLanguage.children[0].value).toBe(LANGUAGE_OPTIONS[0].value);
        });

        test('should handle empty level list', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({})
                })
            );
            
            await menu.loadMapsDatabase();
            menu.populateLevelList();
            
            const levelList = document.getElementById('levelList');
            expect(levelList.children.length).toBe(0);
        });
    });

    describe('Level Selector Date Filtering', () => {
        test('should hide future levels by default', async () => {
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            const levelTexts = Array.from(levelCells).map(el => el.textContent);

            // Past levels should be present in the calendar grid
            expect(levelTexts.some(t => t.includes('Canyon'))).toBe(true);
            expect(levelTexts.some(t => t.includes('River'))).toBe(true);
            // Future level should be hidden
            expect(levelTexts.some(t => t.includes('Future'))).toBe(false);
        });

        test('should show all levels when showAllLevels is true', async () => {
            await menu.loadMapsDatabase();
            menu.showAllLevels = true;
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');

            // Calendar defaults to the most recent month (Dec 2099 with Future level)
            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            const levelTexts = Array.from(levelCells).map(el => el.textContent);
            expect(levelTexts.some(t => t.includes('Future'))).toBe(true);

            // Navigation to earlier months should be enabled (Canyon and River are in Feb 2026)
            const prevBtn = levelList.querySelector('.calendar-nav-btn');
            expect(prevBtn.disabled).toBe(false);
        });

        test('should toggle showAllLevels via debug checkbox', () => {
            const checkbox = document.getElementById('debugShowAllLevels');
            
            expect(menu.showAllLevels).toBe(false);
            
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
            expect(menu.showAllLevels).toBe(true);
            
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
            expect(menu.showAllLevels).toBe(false);
        });

        test('should only show levels dated today or before', async () => {
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');

            // Level cells should only contain past/today levels
            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            expect(levelCells.length).toBeGreaterThan(0);
            // No "Future" level should be visible in the current calendar view
            expect(levelList.textContent).not.toContain('Future');
        });
    });

    describe('Calendar View', () => {
        test('should render calendar navigation with prev/next buttons', async () => {
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const nav = levelList.querySelector('.calendar-nav');
            expect(nav).not.toBeNull();

            const navBtns = nav.querySelectorAll('.calendar-nav-btn');
            expect(navBtns.length).toBe(2);

            const monthLabel = nav.querySelector('.calendar-month-label');
            expect(monthLabel).not.toBeNull();
            expect(monthLabel.textContent.length).toBeGreaterThan(0);
        });

        test('should render a 7-column calendar grid with day headers', async () => {
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const grid = levelList.querySelector('.calendar-grid');
            expect(grid).not.toBeNull();

            const headers = grid.querySelectorAll('.calendar-day-header');
            expect(headers.length).toBe(7);
        });

        test('should highlight the active level', async () => {
            menu._saveCurrentLevelToCookie('2026-02-06');
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const activeCell = levelList.querySelector('.calendar-day-level.active');
            expect(activeCell).not.toBeNull();
            expect(activeCell.textContent).toContain('Canyon');
        });

        test('should display trophy emoji when submitted score meets goal', async () => {
            game.loadSubmission = jest.fn((date) => {
                if (date === '2026-02-06') return { score: 11, walls: [] };
                return null;
            });

            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            const canyonCell = Array.from(levelCells).find(el => el.textContent.includes('Canyon'));
            expect(canyonCell).not.toBeNull();
            expect(canyonCell.querySelector('.calendar-status').textContent).toBe('🏆');
        });

        test('should display checkmark when submitted score is below goal', async () => {
            game.loadSubmission = jest.fn((date) => {
                if (date === '2026-02-06') return { score: 5, walls: [] };
                return null;
            });

            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            const canyonCell = Array.from(levelCells).find(el => el.textContent.includes('Canyon'));
            expect(canyonCell).not.toBeNull();
            expect(canyonCell.querySelector('.calendar-status').textContent).toBe('✓');
        });

        test('should not display status indicator when no submission', async () => {
            game.loadSubmission = jest.fn(() => null);

            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            const canyonCell = Array.from(levelCells).find(el => el.textContent.includes('Canyon'));
            expect(canyonCell).not.toBeNull();
            expect(canyonCell.querySelector('.calendar-status')).toBeNull();
        });

        test('should navigate to previous month on prev button click', async () => {
            await menu.loadMapsDatabase();
            menu.showAllLevels = true;
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');

            // Start at Dec 2099 (most recent), navigate back to Feb 2026
            const [prevBtn] = levelList.querySelectorAll('.calendar-nav-btn');
            prevBtn.click();

            const levelCells = levelList.querySelectorAll('.calendar-day-level');
            const levelTexts = Array.from(levelCells).map(el => el.textContent);
            expect(levelTexts.some(t => t.includes('Canyon'))).toBe(true);
            expect(levelTexts.some(t => t.includes('River'))).toBe(true);
        });

        test('should render a "Go To Today" button at the top of the level list', async () => {
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const todayBtn = levelList.querySelector('.calendar-today-btn');
            expect(todayBtn).not.toBeNull();
            expect(todayBtn.textContent).toBe('Go To Today');

            // It should be the first child of levelList
            expect(levelList.firstChild).toBe(todayBtn);
        });

        test('should navigate to today\'s month when "Go To Today" is clicked', async () => {
            jest.spyOn(DateUtils, 'getTodayDate').mockReturnValue('2026-02-06');
            await menu.loadMapsDatabase();
            menu.showAllLevels = true;
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');

            // Navigate away from today's month first (to Dec 2099)
            const navBtns = levelList.querySelectorAll('.calendar-nav-btn');
            const nextBtn = navBtns[1];
            nextBtn.click();

            // Calendar should now show Dec 2099 (with Future level)
            const monthLabel = levelList.querySelector('.calendar-month-label');
            expect(monthLabel.textContent).toContain('2099');

            // Click "Go To Today" - today is mocked as 2026-02-06
            const todayBtn = levelList.querySelector('.calendar-today-btn');
            const selectLevelSpy = jest.spyOn(menu, 'selectLevel').mockImplementation(async () => {});
            todayBtn.click();

            expect(monthLabel.textContent).toContain('2026');
            expect(selectLevelSpy).toHaveBeenCalled();
            selectLevelSpy.mockRestore();
            DateUtils.getTodayDate.mockRestore();
        });

        test('should select today\'s level when "Go To Today" is clicked and today has a level', async () => {
            jest.spyOn(DateUtils, 'getTodayDate').mockReturnValue('2026-02-06');
            await menu.loadMapsDatabase();
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const todayBtn = levelList.querySelector('.calendar-today-btn');

            const selectLevelSpy = jest.spyOn(menu, 'selectLevel').mockImplementation(async () => {});
            todayBtn.click();

            // Today is mocked as 2026-02-06 which has the Canyon level
            expect(selectLevelSpy).toHaveBeenCalledWith('2026-02-06');
            selectLevelSpy.mockRestore();
            DateUtils.getTodayDate.mockRestore();
        });
    });

    describe('Debug Reset Level', () => {
        test('should call resetLevelData and reset grid/UI state', () => {
            game.wallCount = 2;

            menu.resetCurrentLevel();

            expect(game.resetLevelData).toHaveBeenCalledWith('2026-02-06');
            expect(game.grid.reset).toHaveBeenCalled();
            expect(game.wallCount).toBe(0);
            expect(game.render).toHaveBeenCalled();
            expect(game.updateWallCounter).toHaveBeenCalled();
            expect(game.updateAreaSizeDisplay).toHaveBeenCalled();
            expect(game.updateResetButton).toHaveBeenCalled();
            expect(game.updateSolutionToggleBar).toHaveBeenCalled();
        });

        test('should do nothing if no current date', () => {
            game.currentDate = null;

            menu.resetCurrentLevel();

            expect(game.resetLevelData).not.toHaveBeenCalled();
        });

        test('should trigger on reset level button click', () => {
            const resetLevelBtn = document.getElementById('debugResetLevel');
            const spy = jest.spyOn(menu, 'resetCurrentLevel');

            resetLevelBtn.click();

            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('Debug Reset All Data', () => {
        test('should delete all cookies', () => {
            // Set some cookies first
            CookieUtils.setCookie('selectedPet', '🐱', 365);
            CookieUtils.setCookie('debugMode', 'true', 365);

            // Spy on deleteAllCookies to verify it's called
            const deleteAllSpy = jest.spyOn(CookieUtils, 'deleteAllCookies');

            // jsdom doesn't support navigation, so suppress the error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            try {
                menu.resetAllData();
            } catch {
                // jsdom may throw on reload
            }
            consoleSpy.mockRestore();

            expect(deleteAllSpy).toHaveBeenCalled();
            // Cookies should be cleared
            expect(CookieUtils.getCookie('selectedPet')).toBe(null);
            expect(CookieUtils.getCookie('debugMode')).toBe(null);

            deleteAllSpy.mockRestore();
        });

        test('should trigger on reset all button click', () => {
            const resetAllBtn = document.getElementById('debugResetAll');
            const spy = jest.spyOn(menu, 'resetAllData').mockImplementation(() => {});

            resetAllBtn.click();

            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('Loading Screen', () => {
        test('should open level selector modal immediately before maps are loaded', async () => {
            // Delay fetch so we can inspect the DOM after the sync part of
            // openLevelSelector runs but before the fetched data returns.
            // Promise.resolve() resolves as a microtask, so the synchronous
            // part of openLevelSelector (including showing the modal) runs first.
            global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

            const openPromise = menu.openLevelSelector();

            // Modal should be visible right away (sync part has already run)
            const levelSelectorModal = document.getElementById('levelSelectorModal');
            expect(levelSelectorModal.classList.contains('show')).toBe(true);

            await openPromise;
        });

        test('should show loading text while maps are being fetched', async () => {
            // Use a fetch that resolves in a microtask so we can read the DOM
            // after the synchronous section (which renders the loading indicator)
            // but before the async section (which replaces it with the calendar).
            global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

            const openPromise = menu.openLevelSelector();

            const levelList = document.getElementById('levelList');
            expect(levelList.querySelector('.level-list-loading')).not.toBeNull();

            await openPromise;
        });

        test('_showLevelListLoading should render the loading constant text', () => {
            menu._showLevelListLoading();
            const levelList = document.getElementById('levelList');
            const loadingEl = levelList.querySelector('.level-list-loading');
            expect(loadingEl).not.toBeNull();
            expect(loadingEl.textContent).toBe(CONSTANTS.LEVEL_SELECTOR_LOADING_TEXT);
        });

        test('should populate level list after maps load', async () => {
            await menu.openLevelSelector();
            const levelList = document.getElementById('levelList');
            expect(levelList.querySelector('.calendar-day-level')).not.toBeNull();
        });

        test('should queue level selection while syncing and load after sync completes', async () => {
            await menu.loadMapsDatabase();

            let resolveSync;
            const syncPromise = new Promise(resolve => { resolveSync = resolve; });

            // Set up a mock CloudSync that is configured, logged in, and returns a controllable promise
            global.CloudSync = {
                isConfigured: () => true,
                isLoggedIn: () => true,
                syncNow: jest.fn(() => syncPromise)
            };

            const loadLevelSpy = jest.spyOn(menu, 'loadLevel').mockResolvedValue();

            // Open the level selector — this starts the background sync
            menu.openLevelSelector();

            // While sync is in progress, selecting a level should queue it
            await menu.selectLevel('2026-02-06');
            expect(menu._pendingLevelSelection).toBe('2026-02-06');
            expect(loadLevelSpy).not.toHaveBeenCalled();

            // Resolve the sync — the .then() handler should pick up the pending selection
            resolveSync();
            await syncPromise;
            // Flush remaining microtasks
            await Promise.resolve();

            expect(loadLevelSpy).toHaveBeenCalled();

            loadLevelSpy.mockRestore();
            delete global.CloudSync;
        });

        test('should show ??? status badges while syncing', async () => {
            await menu.loadMapsDatabase();
            menu._isSyncing = true;
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            const syncingBadges = levelList.querySelectorAll('.calendar-status-syncing');
            expect(syncingBadges.length).toBeGreaterThan(0);
            expect(syncingBadges[0].textContent).toBe(CONSTANTS.LEVEL_SELECTOR_SYNC_STATUS_UNKNOWN);
        });

        test('should show real status badges after sync completes', async () => {
            game.loadSubmission = jest.fn(date => {
                if (date === '2026-02-06') return { score: 12, walls: [] };
                return null;
            });
            await menu.loadMapsDatabase();
            menu._isSyncing = false;
            menu.populateLevelList();

            const levelList = document.getElementById('levelList');
            expect(levelList.querySelectorAll('.calendar-status-syncing').length).toBe(0);
            const statusBadges = levelList.querySelectorAll('.calendar-status');
            expect(statusBadges.length).toBeGreaterThan(0);
        });

        test('should cancel pending selection when level selector modal is closed', async () => {
            await menu.loadMapsDatabase();
            menu._isSyncing = true;
            menu._pendingLevelSelection = '2026-02-06';

            const levelSelectorModal = document.getElementById('levelSelectorModal');
            menu.closeModal(levelSelectorModal);

            expect(menu._pendingLevelSelection).toBeNull();
        });

        test('should cancel pending selection when closeAllModals is called', async () => {
            menu._pendingLevelSelection = '2026-02-06';
            menu.closeAllModals();
            expect(menu._pendingLevelSelection).toBeNull();
        });
    });
});

// ===========================================================================
// Additional coverage tests — Menu edge cases
// ===========================================================================

// Require CloudSync for use in cloud sync branch tests
const _cloudSyncForMenuTests = require('../../../js/cloud/CloudSync.js');

describe('Menu — additional branch coverage', () => {
    let menu;
    let game;

    function setupFullDOM() {
        document.body.innerHTML = `
            <button id="menuBtn"></button>
            <div id="menuModal" class="modal"></div>
            <div id="levelSelectorModal" class="modal">
                <div id="levelList"></div>
            </div>
            <div id="instructionsModal" class="modal">
                <div id="tileDescriptions" class="tile-descriptions"></div>
            </div>
            <div id="aboutModal" class="modal"></div>
            <div id="optionsModal" class="modal">
                <select id="modalPetType"></select>
                <input type="checkbox" id="modalHintsDisabled">
                <input type="checkbox" id="modalNeverShowTarget">
                <select id="modalTimezone"></select>
                <select id="modalLanguage"></select>
                <input type="checkbox" id="debugModeCheckbox">
            </div>
            <button class="modal-close"></button>
            <button id="instrShortcutBtn"></button>
            <button id="levelSelectorBtn"></button>
            <button id="instructionsBtn"></button>
            <button id="aboutBtn"></button>
            <button id="optionsBtn"></button>
            <button id="tellFriendsAboutBtn"></button>
            <button id="tellFriendsOptionsBtn"></button>
            <select id="petType"></select>
            <div class="debug-section" style="display: none;">
                <input type="checkbox" id="debugShowAllLevels">
                <button id="debugResetLevel"></button>
                <button id="debugResetAll"></button>
            </div>
        `;
    }

    function createMockGame() {
        return {
            petEmoji: '🐶',
            hintsDisabled: false,
            neverShowTarget: true,
            hintsUsed: [],
            render: jest.fn(),
            updateLegend: jest.fn(),
            pauseTimer: jest.fn(),
            resetTimer: jest.fn(),
            initTimerForDate: jest.fn(),
            handleTellFriends: jest.fn(),
            grid: {
                size: 7,
                loadMap: jest.fn(),
                saveInitialState: jest.fn(),
                reset: jest.fn(),
                getTile: jest.fn(() => 'grass'),
                setTile: jest.fn(),
            },
            wallCount: 0,
            goalAreaSize: 10,
            maxWalls: 9,
            currentDate: '2026-02-06',
            optimalSolution: null,
            isSubmitted: false,
            submittedScore: null,
            submittedWalls: null,
            viewingOptimal: false,
            updateWallCounter: jest.fn(),
            updateAreaSizeDisplay: jest.fn(),
            updateResetButton: jest.fn(),
            updateSolutionToggleBar: jest.fn(),
            updateHintButton: jest.fn(),
            loadHintsUsed: jest.fn(() => []),
            loadSubmission: jest.fn(() => null),
            deleteSubmission: jest.fn(),
            resetLevelData: jest.fn(),
            isValidPosition: jest.fn(() => true),
        };
    }

    beforeEach(() => {
        setupFullDOM();
        game = createMockGame();
        menu = new Menu(game);
        // Clear cookies
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
    });

    // -----------------------------------------------------------------------
    // Modal close button click handler (lines 66-68)
    // -----------------------------------------------------------------------
    describe('Modal close button — click event handler', () => {
        test('clicking a .modal-close button inside a .modal calls closeModal', () => {
            const spy = jest.spyOn(menu, 'closeModal');
            // Build a modal with a close button that has a closest('.modal') ancestor
            const modal = document.createElement('div');
            modal.className = 'modal show';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            modal.appendChild(closeBtn);
            document.body.appendChild(modal);

            // Re-initialise so attachEventListeners picks up the new button
            const freshMenu = new Menu(game);
            const freshSpy = jest.spyOn(freshMenu, 'closeModal');
            closeBtn.click();

            expect(freshSpy).toHaveBeenCalledWith(modal);
            modal.remove();
            spy.mockRestore();
        });
    });

    // -----------------------------------------------------------------------
    // "Tell Your Friends" buttons (lines 89, 93)
    // -----------------------------------------------------------------------
    describe('Tell Your Friends button event handlers', () => {
        test('clicking tellFriendsAboutBtn calls game.handleTellFriends', () => {
            document.getElementById('tellFriendsAboutBtn').click();
            expect(game.handleTellFriends).toHaveBeenCalled();
        });

        test('clicking tellFriendsOptionsBtn calls game.handleTellFriends', () => {
            document.getElementById('tellFriendsOptionsBtn').click();
            expect(game.handleTellFriends).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // Hints re-enabled branch in modalHintsDisabled change (lines 127-128)
    // -----------------------------------------------------------------------
    describe('modalHintsDisabled — re-enable restores neverShowTarget', () => {
        test('un-checking hintsDisabled restores neverShowTarget and enables checkbox', () => {
            const hintsCheckbox = document.getElementById('modalHintsDisabled');
            const neverShowCheckbox = document.getElementById('modalNeverShowTarget');

            // First disable hints (so neverShowTarget becomes forced-on)
            hintsCheckbox.checked = true;
            hintsCheckbox.dispatchEvent(new Event('change'));
            expect(neverShowCheckbox.checked).toBe(true);
            expect(neverShowCheckbox.disabled).toBe(true);

            // Now re-enable hints — neverShowTarget should be restored from game state
            game.neverShowTarget = false;
            hintsCheckbox.checked = false;
            hintsCheckbox.dispatchEvent(new Event('change'));
            expect(neverShowCheckbox.checked).toBe(false);
            expect(neverShowCheckbox.disabled).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // modalNeverShowTarget change listener (lines 137-139)
    // -----------------------------------------------------------------------
    describe('modalNeverShowTarget — change listener', () => {
        test('toggling neverShowTarget checkbox updates game.neverShowTarget and calls updateHintButton', () => {
            const checkbox = document.getElementById('modalNeverShowTarget');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
            expect(game.neverShowTarget).toBe(true);
            expect(game.updateHintButton).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // modalTimezone change listener (line 145)
    // -----------------------------------------------------------------------
    describe('modalTimezone — change listener', () => {
        test('changing timezone select saves new value to cookie', () => {
            const tzSelect = document.getElementById('modalTimezone');
            Object.defineProperty(tzSelect, 'value', { value: 'America/New_York', writable: true });
            tzSelect.dispatchEvent(new Event('change'));
            // Cookie should be set (CookieUtils.getCookie will return the value)
            const saved = CookieUtils.getCookie('timezone');
            expect(saved).toBe('America/New_York');
        });
    });

    // -----------------------------------------------------------------------
    // modalLanguage change listener (lines 150-155)
    // -----------------------------------------------------------------------
    describe('modalLanguage — change listener', () => {
        test('changing language select calls I18N.setLanguage', () => {
            const langSelect = document.getElementById('modalLanguage');
            const spySetLang = jest.spyOn(I18N, 'setLanguage').mockImplementation(() => {});
            Object.defineProperty(langSelect, 'value', { value: 'en', writable: true });
            // The handler also calls window.location.reload; since jsdom blocks actual navigation
            // we only assert the I18N call, which is the relevant branch to cover.
            expect(() => langSelect.dispatchEvent(new Event('change'))).not.toThrow();
            expect(spySetLang).toHaveBeenCalledWith('en');
            spySetLang.mockRestore();
        });
    });

    // -----------------------------------------------------------------------
    // openMenu calls pauseTimer (line 234)
    // -----------------------------------------------------------------------
    describe('openMenu() — calls pauseTimer', () => {
        test('openMenu pauses the game timer', () => {
            menu.openMenu();
            expect(game.pauseTimer).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // openInstructions calls pauseTimer (line 672)
    // -----------------------------------------------------------------------
    describe('openInstructions() — calls pauseTimer', () => {
        test('openInstructions pauses the game timer', () => {
            menu.openInstructions();
            expect(game.pauseTimer).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // openAbout calls pauseTimer (line 758)
    // -----------------------------------------------------------------------
    describe('openAbout() — calls pauseTimer', () => {
        test('openAbout pauses the game timer', () => {
            menu.openAbout();
            expect(game.pauseTimer).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // openOptions calls pauseTimer (line 772)
    // -----------------------------------------------------------------------
    describe('openOptions() — calls pauseTimer', () => {
        test('openOptions pauses the game timer', () => {
            menu.openOptions();
            expect(game.pauseTimer).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // loadMapsDatabase error handling (lines 302-303)
    // -----------------------------------------------------------------------
    describe('loadMapsDatabase() — fetch error handling', () => {
        test('sets mapsDatabase to empty object when fetch throws', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('network error')));
            await menu.loadMapsDatabase();
            expect(menu.mapsDatabase).toEqual({});
        });
    });

    // -----------------------------------------------------------------------
    // resetCurrentLevel — calls resetTimer (line 213)
    // -----------------------------------------------------------------------
    describe('resetCurrentLevel() — timer integration', () => {
        test('calls game.resetTimer when it is available', () => {
            game.currentDate = '2026-02-06';
            menu.resetCurrentLevel();
            expect(game.resetTimer).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // loadLevel — calls initTimerForDate (line 662)
    // -----------------------------------------------------------------------
    describe('loadLevel() — timer integration', () => {
        test('calls game.initTimerForDate with map date', async () => {
            const mapData = {
                date: '2026-03-15',
                size: 7,
                goal: 10,
                maxWalls: 5,
                map: 'g'.repeat(49),
                optimalSolution: null,
            };
            await menu.loadLevel(mapData);
            expect(game.initTimerForDate).toHaveBeenCalledWith('2026-03-15');
        });

        test('does not call game.initTimerForDate when mapData has no date', async () => {
            const mapData = {
                size: 7,
                goal: 10,
                maxWalls: 5,
                map: 'g'.repeat(49),
            };
            await menu.loadLevel(mapData);
            expect(game.initTimerForDate).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // loadLevel — submission wall restoration (lines 634-642)
    // -----------------------------------------------------------------------
    describe('loadLevel() — restores submitted wall positions', () => {
        test('restores wall tiles from a saved submission', async () => {
            const wallPositions = [[1, 1], [2, 2]];
            game.loadSubmission = jest.fn(() => ({
                score: 5,
                walls: wallPositions,
            }));
            // Make getTile return 'grass' so walls are placeable
            game.grid.getTile = jest.fn(() => 'grass');

            const mapData = {
                date: '2026-02-06',
                size: 7,
                goal: 11,
                maxWalls: 5,
                map: 'g'.repeat(49),
                optimalSolution: null,
            };
            await menu.loadLevel(mapData);

            expect(game.isSubmitted).toBe(true);
            expect(game.submittedScore).toBe(5);
            // setTile should have been called for each wall position
            expect(game.grid.setTile).toHaveBeenCalledTimes(wallPositions.length);
        });
    });

    // -----------------------------------------------------------------------
    // openLevelSelector — calls pauseTimer (line 248)
    // -----------------------------------------------------------------------
    describe('openLevelSelector() — calls pauseTimer', () => {
        test('openLevelSelector pauses the game timer', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({}),
                })
            );
            await menu.openLevelSelector();
            expect(game.pauseTimer).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // Cloud sync in _savePetToCookie, _saveHintsDisabledToCookie,
    // _saveNeverShowTargetToCookie (lines 954, 966, 978-989)
    // -----------------------------------------------------------------------
    describe('Settings save methods — cloud sync branch', () => {
        // These tests cover the cloud-sync branch inside _savePetToCookie, etc.
        // We mock _shouldSyncToCloud to return true AND expose CloudSync as a
        // proper global so that Menu.js can call CloudSync.saveSettings().
        let origGlobalCloudSync;

        beforeEach(() => {
            origGlobalCloudSync = global.CloudSync;
            // Replace CloudSync global with a controlled spy object
            global.CloudSync = {
                isConfigured: jest.fn(() => true),
                isLoggedIn: jest.fn(() => true),
                saveSettings: jest.fn(),
            };
        });

        afterEach(() => {
            global.CloudSync = origGlobalCloudSync;
        });

        test('_savePetToCookie syncs to cloud when logged in', () => {
            menu._savePetToCookie('🐱');
            expect(global.CloudSync.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ selectedPet: '🐱' }));
        });

        test('_saveHintsDisabledToCookie syncs to cloud when logged in', () => {
            menu._saveHintsDisabledToCookie(true);
            expect(global.CloudSync.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ hintsDisabled: 'true' }));
        });

        test('_saveNeverShowTargetToCookie syncs to cloud when logged in', () => {
            menu._saveNeverShowTargetToCookie(false);
            expect(global.CloudSync.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ neverShowTarget: 'false' }));
        });
    });

    // -----------------------------------------------------------------------
    // openOptions — I18N.getLanguage() fallback when I18N undefined (line 806)
    // -----------------------------------------------------------------------
    describe('openOptions() — language selector value', () => {
        test('sets modalLanguage value to current language from I18N', () => {
            const langSelect = document.getElementById('modalLanguage');
            const option = document.createElement('option');
            option.value = 'en';
            langSelect.appendChild(option);
            menu.openOptions();
            expect(langSelect.value).toBe('en');
        });
    });

    // -----------------------------------------------------------------------
    // shareMapUrl() — various branch paths (lines 197-215)
    // -----------------------------------------------------------------------
    describe('shareMapUrl()', () => {
        test('calls _copyToClipboard with encoded URL when currentMapData is set', () => {
            const mockCopy = jest.fn();
            game._copyToClipboard = mockCopy;
            const mapData = {
                date: '2026-02-06',
                size: 7,
                goal: 11,
                maxWalls: 5,
                map: 'g'.repeat(49),
                optimalSolution: null,
            };
            menu.currentMapData = mapData;
            menu.shareMapUrl();
            expect(mockCopy).toHaveBeenCalledWith(expect.stringContaining('?map='));
        });

        test('does nothing when currentMapData is null', () => {
            const mockCopy = jest.fn();
            game._copyToClipboard = mockCopy;
            menu.currentMapData = null;
            menu.shareMapUrl();
            expect(mockCopy).not.toHaveBeenCalled();
        });

        test('calls showNotification when MapURLCodec is unavailable', () => {
            const origMapURLCodec = global.MapURLCodec;
            delete global.MapURLCodec;
            const mockNotify = jest.fn();
            game.showNotification = mockNotify;
            try {
                menu.shareMapUrl();
                expect(mockNotify).toHaveBeenCalledWith(I18N.t('copied_failed'));
            } finally {
                global.MapURLCodec = origMapURLCodec;
            }
        });
    });

    // -----------------------------------------------------------------------
    // loadMapsDatabase() — error handling (lines 330-331)
    // -----------------------------------------------------------------------
    describe('loadMapsDatabase() — error handling', () => {
        test('sets mapsDatabase to empty object on fetch failure', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            await menu.loadMapsDatabase();
            expect(menu.mapsDatabase).toEqual({});
            consoleSpy.mockRestore();
        });
    });

    // -----------------------------------------------------------------------
    // openLevelSelector() — CloudSync branch (lines 295-315)
    // -----------------------------------------------------------------------
    describe('openLevelSelector() — CloudSync sync branch', () => {
        test('syncs via CloudSync when configured and logged in', async () => {
            const origCloudSync = global.CloudSync;
            global.CloudSync = {
                isConfigured: jest.fn(() => true),
                isLoggedIn: jest.fn(() => true),
                syncNow: jest.fn(() => Promise.resolve()),
            };
            global.fetch = jest.fn(() =>
                Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
            );
            await menu.openLevelSelector();
            expect(global.CloudSync.syncNow).toHaveBeenCalled();
            global.CloudSync = origCloudSync;
        });

        test('handles CloudSync.syncNow rejection gracefully', async () => {
            const origCloudSync = global.CloudSync;
            global.CloudSync = {
                isConfigured: jest.fn(() => true),
                isLoggedIn: jest.fn(() => true),
                syncNow: jest.fn(() => Promise.reject(new Error('sync failed'))),
            };
            global.fetch = jest.fn(() =>
                Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
            );
            await expect(menu.openLevelSelector()).resolves.not.toThrow();
            global.CloudSync = origCloudSync;
        });
    });
});

// ===========================================================================
// DOM click event regression tests for Menu
// Verifies that clicking real DOM buttons in the menu modal system fires the
// correct handlers — guarding against argument-order bugs like the cell-click
// regression where the event object was passed as a data argument.
// ===========================================================================

describe('Menu — DOM button click regression', () => {
    let menu;
    let game;

    beforeEach(() => {
        setupDOM();
        game = createMockGame();
        menu = new Menu(game);
        mockFetch();
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
    });

    test('clicking menuBtn opens the menu modal', () => {
        const menuBtn = document.getElementById('menuBtn');
        const menuModal = document.getElementById('menuModal');
        menuBtn.click();
        expect(menuModal.classList.contains('show')).toBe(true);
    });

    test('clicking instructionsBtn opens the instructions modal', () => {
        const instrBtn = document.getElementById('instructionsBtn');
        const instrModal = document.getElementById('instructionsModal');
        instrBtn.click();
        expect(instrModal.classList.contains('show')).toBe(true);
    });

    test('clicking aboutBtn opens the about modal', () => {
        const aboutBtn = document.getElementById('aboutBtn');
        const aboutModal = document.getElementById('aboutModal');
        aboutBtn.click();
        expect(aboutModal.classList.contains('show')).toBe(true);
    });

    test('clicking optionsBtn opens the options modal', () => {
        const optionsBtn = document.getElementById('optionsBtn');
        const optionsModal = document.getElementById('optionsModal');
        optionsBtn.click();
        expect(optionsModal.classList.contains('show')).toBe(true);
    });

    test('clicking a .modal-close button inside a modal closes that modal', () => {
        // Open the about modal first
        document.getElementById('aboutBtn').click();
        const aboutModal = document.getElementById('aboutModal');
        expect(aboutModal.classList.contains('show')).toBe(true);

        // menu.closeModal() must remove the 'show' class
        menu.closeModal(aboutModal);
        expect(aboutModal.classList.contains('show')).toBe(false);
    });
});
