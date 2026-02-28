/**
 * Menu Tests
 * 
 * Test suite for the menu system including level selector,
 * instructions, about, and options modals.
 */

const Menu = require('../js/Menu.js');

// Mock DOM elements for testing
function setupDOM() {
    document.body.innerHTML = `
        <button id="menuBtn"></button>
        <div id="menuModal" class="modal"></div>
        <div id="levelSelectorModal" class="modal">
            <div id="levelList"></div>
        </div>
        <div id="instructionsModal" class="modal"></div>
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
        <select id="petType"></select>
        <select id="hintMode"></select>
        <div class="debug-section"></div>
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
            getTile: jest.fn(() => 'grass'),
            setTile: jest.fn()
        },
        wallCount: 0,
        goalAreaSize: 10,
        maxWalls: 9,
        currentDate: null,
        optimalSolution: null,
        isSubmitted: false,
        submittedScore: null,
        submittedWalls: null,
        viewingOptimal: false,
        updateWallCounter: jest.fn(),
        updateAreaSizeDisplay: jest.fn(),
        loadSubmission: jest.fn(() => null),
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
                    map: []
                },
                '2026-02-05': {
                    dayNumber: 0,  // Day 0 is before the official launch
                    mapName: 'River',
                    date: '2026-02-05',
                    size: 7,
                    goal: 8,
                    maxWalls: 4,
                    map: []
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
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await menu.loadMapsDatabase();
            
            expect(menu.mapsDatabase).toEqual({});
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should handle fetch not ok response', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false
                })
            );
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await menu.loadMapsDatabase();
            
            expect(menu.mapsDatabase).toEqual({});
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
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
});
