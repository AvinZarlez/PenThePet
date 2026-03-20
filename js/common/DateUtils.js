/**
 * Date Utilities
 * 
 * Shared date helper functions used by Menu and main.
 * Provides a single source of truth for date operations to avoid
 * duplicated logic across multiple files.
 */

const DateUtils = {
    /**
     * Get today's date in ISO format (YYYY-MM-DD) for a given IANA timezone.
     * Falls back to UTC if the timezone is invalid or unsupported.
     * @param {string} [timezone] - IANA timezone string (e.g. 'America/Los_Angeles').
     *   Defaults to CONSTANTS.DEFAULT_TIMEZONE when available, otherwise UTC.
     * @returns {string} Today's date string in YYYY-MM-DD format
     */
    getTodayDate(timezone) {
        const tz = timezone ||
            (typeof CONSTANTS !== 'undefined' ? CONSTANTS.DEFAULT_TIMEZONE : 'UTC');
        try {
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: tz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(new Date());
            const y = parts.find(p => p.type === 'year').value;
            const m = parts.find(p => p.type === 'month').value;
            const d = parts.find(p => p.type === 'day').value;
            return `${y}-${m}-${d}`;
        } catch (_) {
            // Intl.DateTimeFormat throws RangeError for unknown/invalid timezones.
            // Fall back to raw UTC rather than crashing the page.
            return new Date().toISOString().split('T')[0];
        }
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
