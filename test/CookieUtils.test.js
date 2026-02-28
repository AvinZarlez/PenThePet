/**
 * CookieUtils Tests
 * 
 * Tests for the shared cookie utility functions.
 */

describe('CookieUtils', () => {
    beforeEach(() => {
        // Clear all cookies before each test
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
    });

    describe('getCookie()', () => {
        test('should return null for non-existent cookie', () => {
            expect(CookieUtils.getCookie('nonexistent')).toBe(null);
        });

        test('should return cookie value when set', () => {
            document.cookie = 'testCookie=testValue;path=/';
            expect(CookieUtils.getCookie('testCookie')).toBe('testValue');
        });

        test('should handle encoded cookie values', () => {
            CookieUtils.setCookie('encoded', 'hello world', 1);
            expect(CookieUtils.getCookie('encoded')).toBe('hello world');
        });

        test('should handle emoji values', () => {
            CookieUtils.setCookie('emoji', '🐶', 1);
            expect(CookieUtils.getCookie('emoji')).toBe('🐶');
        });

        test('should distinguish between similar cookie names', () => {
            CookieUtils.setCookie('test', 'value1', 1);
            CookieUtils.setCookie('testExtra', 'value2', 1);
            expect(CookieUtils.getCookie('test')).toBe('value1');
            expect(CookieUtils.getCookie('testExtra')).toBe('value2');
        });
    });

    describe('setCookie()', () => {
        test('should set a cookie that can be read back', () => {
            CookieUtils.setCookie('myKey', 'myValue', 365);
            expect(CookieUtils.getCookie('myKey')).toBe('myValue');
        });

        test('should overwrite existing cookie', () => {
            CookieUtils.setCookie('key', 'old', 1);
            CookieUtils.setCookie('key', 'new', 1);
            expect(CookieUtils.getCookie('key')).toBe('new');
        });

        test('should handle empty string value', () => {
            CookieUtils.setCookie('empty', '', 1);
            expect(CookieUtils.getCookie('empty')).toBe('');
        });

        test('should handle JSON string values', () => {
            const json = JSON.stringify({ score: 10, walls: [[1, 2]] });
            CookieUtils.setCookie('data', json, 1);
            const result = CookieUtils.getCookie('data');
            expect(JSON.parse(result)).toEqual({ score: 10, walls: [[1, 2]] });
        });
    });

    describe('deleteCookie()', () => {
        test('should delete an existing cookie', () => {
            CookieUtils.setCookie('toDelete', 'value', 1);
            expect(CookieUtils.getCookie('toDelete')).toBe('value');

            CookieUtils.deleteCookie('toDelete');
            expect(CookieUtils.getCookie('toDelete')).toBe(null);
        });

        test('should not throw when deleting non-existent cookie', () => {
            expect(() => CookieUtils.deleteCookie('nonexistent')).not.toThrow();
        });
    });

    describe('deleteAllCookies()', () => {
        test('should delete all cookies', () => {
            CookieUtils.setCookie('cookie1', 'a', 1);
            CookieUtils.setCookie('cookie2', 'b', 1);
            CookieUtils.setCookie('cookie3', 'c', 1);

            CookieUtils.deleteAllCookies();

            expect(CookieUtils.getCookie('cookie1')).toBe(null);
            expect(CookieUtils.getCookie('cookie2')).toBe(null);
            expect(CookieUtils.getCookie('cookie3')).toBe(null);
        });

        test('should handle when no cookies exist', () => {
            expect(() => CookieUtils.deleteAllCookies()).not.toThrow();
        });
    });
});
