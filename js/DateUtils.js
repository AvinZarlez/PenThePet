/**
 * Date Utilities
 * 
 * Shared date helper functions used by Menu and main.
 * Provides a single source of truth for date operations to avoid
 * duplicated logic across multiple files.
 */

const DateUtils = {
    /**
     * Get today's date in ISO format (YYYY-MM-DD)
     * @returns {string} Today's date string
     */
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },

    /**
     * Format date string for display
     * @param {string} dateStr - ISO date string (YYYY-MM-DD)
     * @returns {string} Formatted date (e.g., "Feb 6, 2026")
     */
    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
}
