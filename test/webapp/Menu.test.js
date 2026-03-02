/**
 * Menu Tests
 * 
 * Test suite for the menu system including level selector,
 * instructions, about, and options modals.
 */

const Menu = require('../../js/Menu.js');

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
            <select id="modalHintMode">
                <option value="disabled">Disabled</option>
                <option value="checkOptimal">Check Optimal</option>
                <option value="revealTarget">Reveal Target</option>
            </select>
            <input type="checkbox" id="debugModeCheckbox">
        </div>
        <button class="modal-close"></button>
        <button id="levelSelectorBtn"></button>
        <button id="instructionsBtn"></button>
        <button id="aboutBtn"></button>
        <button id="optionsBtn"></button>
        <button id="verifyBtn"></button>
        <div id="verifyModal" class="modal">
            <div class="modal-section">
                <textarea id="verifyInput" rows="6"></textarea>
                <button id="verifySubmitBtn"></button>
                <div id="verifyResult" class="verify-result"></div>
            </div>
        </div>
        <select id="petType"></select>
        <select id="hintMode"></select>
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
        hintMode: 'disabled',
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
        loadSubmission: jest.fn(() => null),
        deleteSubmission: jest.fn(),
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

        test('should populate tile descriptions from TILE_DATA', () => {
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = container.querySelectorAll('.tile-desc-row');
            const tilesWithDesc = Object.values(TILE_DATA).filter(d => d.description);
            expect(rows.length).toBe(tilesWithDesc.length);
        });

        test('should not duplicate tile descriptions on multiple opens', () => {
            menu.openInstructions();
            menu.openInstructions();
            const container = document.getElementById('tileDescriptions');
            const rows = container.querySelectorAll('.tile-desc-row');
            const tilesWithDesc = Object.values(TILE_DATA).filter(d => d.description);
            expect(rows.length).toBe(tilesWithDesc.length);
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

        test('should save and load hint mode', () => {
            menu._saveHintModeToCookie('checkOptimal');
            const loaded = CookieUtils.getCookie('hintMode');
            expect(loaded).toBe('checkOptimal');
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

        test('should sync hint mode between modal and main selector', () => {
            const modalHintMode = document.getElementById('modalHintMode');
            
            // Simulate change
            modalHintMode.value = 'checkOptimal';
            modalHintMode.dispatchEvent(new Event('change'));
            
            expect(game.hintMode).toBe('checkOptimal');
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
        test('should delete submission and reset game state', () => {
            game.isSubmitted = true;
            game.submittedScore = 8;
            game.submittedWalls = [[1, 2], [3, 4]];
            game.viewingOptimal = true;
            game.wallCount = 2;

            menu.resetCurrentLevel();

            expect(game.deleteSubmission).toHaveBeenCalledWith('2026-02-06');
            expect(game.isSubmitted).toBe(false);
            expect(game.submittedScore).toBe(null);
            expect(game.submittedWalls).toBe(null);
            expect(game.viewingOptimal).toBe(false);
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

            expect(game.deleteSubmission).not.toHaveBeenCalled();
        });

        test('should trigger on reset level button click', () => {
            const resetLevelBtn = document.getElementById('debugResetLevel');
            const spy = jest.spyOn(menu, 'resetCurrentLevel');

            resetLevelBtn.click();

            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('Verify Score modal', () => {
        test('openVerify() shows the verify modal', () => {
            menu.openVerify();
            const modal = document.getElementById('verifyModal');
            expect(modal.classList.contains('show')).toBe(true);
        });

        test('openVerify() clears previous input and result', () => {
            document.getElementById('verifyInput').value = 'old text';
            document.getElementById('verifyResult').textContent = 'old result';
            menu.openVerify();
            expect(document.getElementById('verifyInput').value).toBe('');
            expect(document.getElementById('verifyResult').textContent).toBe('');
        });

        test('_handleVerifySubmit() shows error for empty input', async () => {
            menu.openVerify();
            document.getElementById('verifyInput').value = '';
            await menu._handleVerifySubmit();
            const result = document.getElementById('verifyResult');
            expect(result.className).toContain('verify-result-error');
        });

        test('_handleVerifySubmit() shows error for undecodable input', async () => {
            menu.openVerify();
            document.getElementById('verifyInput').value = 'not a valid token at all';
            await menu._handleVerifySubmit();
            const result = document.getElementById('verifyResult');
            expect(result.className).toContain('verify-result-error');
        });

        test('_handleVerifySubmit() shows valid result for a correct token', async () => {
            menu.openVerify();
            const payload = SignatureUtils.buildPayload('Alice', '2026-03-01', 8, 10, 93);
            const token = await SignatureUtils.sign(payload);
            document.getElementById('verifyInput').value = token;
            await menu._handleVerifySubmit();
            const result = document.getElementById('verifyResult');
            expect(result.className).toContain('verify-result-valid');
            expect(result.innerHTML).toContain('Alice');
        });

        test('_handleVerifySubmit() accepts a full share message', async () => {
            menu.openVerify();
            const payload = SignatureUtils.buildPayload('Bob', '2026-03-01', 5, 10, 60);
            const token = await SignatureUtils.sign(payload);
            const shareMsg = [
                'Pen The Pet 🐶',
                'Day 1 - March 1, 2026',
                'Score: 50% (5/10) Time: 01:00',
                `Signature: ${token}`,
            ].join('\n');
            document.getElementById('verifyInput').value = shareMsg;
            await menu._handleVerifySubmit();
            const result = document.getElementById('verifyResult');
            expect(result.className).toContain('verify-result-valid');
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
});
