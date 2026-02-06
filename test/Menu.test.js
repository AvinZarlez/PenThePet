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
            loadMap: jest.fn(),
            saveInitialState: jest.fn()
        },
        wallCount: 0,
        goalAreaSize: 10,
        maxWalls: 9,
        updateWallCounter: jest.fn(),
        updateAreaSizeDisplay: jest.fn()
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
                    dayNumber: 0,
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
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
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
            const loaded = menu._getCookie('selectedPet');
            expect(loaded).toBe('🐱');
        });

        test('should save and load hint mode', () => {
            menu._saveHintModeToCookie('checkOptimal');
            const loaded = menu._getCookie('hintMode');
            expect(loaded).toBe('checkOptimal');
        });

        test('should save and load debug mode', () => {
            menu._saveDebugModeToCookie(true);
            const loaded = menu._loadDebugModeFromCookie();
            expect(loaded).toBe(true);
        });

        test('should save and load current level', () => {
            menu._saveCurrentLevelToCookie('2026-02-05');
            const loaded = menu._getCookie('currentLevel');
            expect(loaded).toBe('2026-02-05');
        });

        test('should handle missing cookies gracefully', () => {
            const value = menu._getCookie('nonexistent');
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
            const petType = document.getElementById('petType');
            
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
            
            const savedLevel = menu._getCookie('currentLevel');
            expect(savedLevel).toBe('2026-02-06');
        });
    });
});
