/**
 * Cookie Utilities
 * 
 * Shared cookie helper functions used by Game, Menu, and main.
 * Provides a single source of truth for cookie operations to avoid
 * duplicated logic across multiple files.
 */

const CookieUtils = {
    /**
     * Get a cookie value by name
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null if not found
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop().split(';').shift());
        }
        return null;
    },

    /**
     * Set a cookie with expiration
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiration in days
     */
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
    },

    /**
     * Delete a cookie by name
     * @param {string} name - Cookie name to delete
     */
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
    },

    /**
     * Delete all cookies set by this application
     */
    deleteAllCookies() {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const name = cookie.split('=')[0].trim();
            if (name) {
                this.deleteCookie(name);
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CookieUtils;
}
