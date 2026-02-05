/**
 * Main Application Entry Point
 * 
 * Initializes the game when the page loads.
 * Modify this file to change initialization behavior or add global event handlers.
 */

let game;

/**
 * Initialize the game application
 */
function initGame() {
    game = new Game(CONFIG.grid.defaultSize);
    
    // Export for potential use in console or testing
    if (typeof window !== 'undefined') {
        window.game = game;
    }
    
    // Future: Add additional initialization logic here
    // Example: Load saved game state from localStorage
    // Example: Set up global keyboard shortcuts
    // Example: Initialize analytics or logging
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', initGame);
