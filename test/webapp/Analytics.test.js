/**
 * Analytics Tests
 *
 * Tests for the Analytics module. These tests verify that the module
 * behaves correctly both when Firebase is configured with a measurementId
 * and when it is in local-only mode (no measurementId set).
 */

describe('Analytics', () => {
    describe('isConfigured()', () => {
        test('should return false when measurementId is empty', () => {
            expect(Analytics.isConfigured()).toBe(false);
        });

        test('should return true when measurementId is set', () => {
            const original = global.FIREBASE_CONFIG;
            global.FIREBASE_CONFIG = { ...original, measurementId: 'G-TEST12345' };
            expect(Analytics.isConfigured()).toBe(true);
            global.FIREBASE_CONFIG = original;
        });
    });

    describe('init()', () => {
        test('should not throw when measurementId is not configured', () => {
            expect(() => Analytics.init()).not.toThrow();
        });

        test('should not throw when Firebase SDK is not loaded', () => {
            const original = global.FIREBASE_CONFIG;
            global.FIREBASE_CONFIG = { ...original, measurementId: 'G-TEST12345' };
            // firebase global does not exist in test env
            expect(() => Analytics.init()).not.toThrow();
            global.FIREBASE_CONFIG = original;
        });

        test('should warn when measurementId is set but Firebase SDK is missing', () => {
            const original = global.FIREBASE_CONFIG;
            global.FIREBASE_CONFIG = { ...original, measurementId: 'G-TEST12345' };
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            Analytics.init();
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Firebase SDK')
            );
            warnSpy.mockRestore();
            global.FIREBASE_CONFIG = original;
        });
    });

    describe('trackLevelLoaded()', () => {
        test('should not throw when analytics is not initialised', () => {
            expect(() => Analytics.trackLevelLoaded('2026-01-01', false)).not.toThrow();
        });

        test('should not throw with already-completed level', () => {
            expect(() => Analytics.trackLevelLoaded('2026-01-01', true)).not.toThrow();
        });
    });

    describe('trackLevelCompleted()', () => {
        test('should not throw when analytics is not initialised', () => {
            expect(() =>
                Analytics.trackLevelCompleted('2026-01-01', 8, 10, 5, 120, false, false, false)
            ).not.toThrow();
        });

        test('should not throw for a perfect score', () => {
            expect(() =>
                Analytics.trackLevelCompleted('2026-01-01', 10, 10, 4, 60, true, false, false)
            ).not.toThrow();
        });

        test('should not throw when hints were used', () => {
            expect(() =>
                Analytics.trackLevelCompleted('2026-02-15', 10, 10, 3, 300, true, true, true)
            ).not.toThrow();
        });
    });

    describe('trackError()', () => {
        test('should not throw when analytics is not initialised', () => {
            expect(() => Analytics.trackError('Something went wrong', 'main.js')).not.toThrow();
        });

        test('should truncate long error messages without throwing', () => {
            const longMsg = 'x'.repeat(300);
            expect(() => Analytics.trackError(longMsg, 'file.js')).not.toThrow();
        });
    });

    describe('logEvent() via mock firebase instance', () => {
        let mockLogEvent;
        let mockAnalyticsInstance;

        beforeEach(() => {
            mockLogEvent = jest.fn();
            mockAnalyticsInstance = { logEvent: mockLogEvent };

            // Inject a mock firebase global with an analytics() factory
            global.firebase = {
                apps: [{}],  // Pretend an app is already initialized
                analytics: jest.fn().mockReturnValue(mockAnalyticsInstance),
                initializeApp: jest.fn(),
            };

            const original = global.FIREBASE_CONFIG;
            global.FIREBASE_CONFIG = { ...original, measurementId: 'G-TEST12345' };
            Analytics.init();
            global.FIREBASE_CONFIG = original;
        });

        afterEach(() => {
            delete global.firebase;
        });

        test('trackLevelLoaded calls logEvent with correct name and params', () => {
            Analytics.trackLevelLoaded('2026-01-01', false);
            expect(mockLogEvent).toHaveBeenCalledWith('level_loaded', {
                puzzle_date: '2026-01-01',
                already_completed: false,
            });
        });

        test('trackLevelCompleted calls logEvent with correct params', () => {
            Analytics.trackLevelCompleted('2026-01-01', 8, 10, 5, 120, false, false, false);
            expect(mockLogEvent).toHaveBeenCalledWith('level_completed', {
                puzzle_date: '2026-01-01',
                score: 8,
                goal_score: 10,
                walls_used: 5,
                elapsed_seconds: 120,
                is_perfect: false,
                check_used: false,
                reveal_used: false,
            });
        });

        test('trackLevelCompleted marks perfect score correctly', () => {
            Analytics.trackLevelCompleted('2026-03-01', 10, 10, 3, 60, true, false, false);
            expect(mockLogEvent).toHaveBeenCalledWith('level_completed', expect.objectContaining({
                is_perfect: true,
                score: 10,
                goal_score: 10,
            }));
        });

        test('trackLevelCompleted includes check_used and reveal_used booleans', () => {
            Analytics.trackLevelCompleted('2026-01-01', 8, 10, 5, 120, false, true, true);
            expect(mockLogEvent).toHaveBeenCalledWith('level_completed', expect.objectContaining({
                check_used: true,
                reveal_used: true,
            }));
        });

        test('trackError calls logEvent with correct params', () => {
            Analytics.trackError('Uncaught TypeError', 'js/Game.js');
            expect(mockLogEvent).toHaveBeenCalledWith('js_error', {
                error_message: 'Uncaught TypeError',
                error_source: 'js/Game.js',
            });
        });

        test('trackError truncates message to 150 characters', () => {
            const longMsg = 'A'.repeat(200);
            Analytics.trackError(longMsg, 'file.js');
            expect(mockLogEvent).toHaveBeenCalledWith('js_error', expect.objectContaining({
                error_message: 'A'.repeat(150),
            }));
        });

        test('trackError truncates source to 100 characters', () => {
            const longSrc = 'B'.repeat(150);
            Analytics.trackError('err', longSrc);
            expect(mockLogEvent).toHaveBeenCalledWith('js_error', expect.objectContaining({
                error_source: 'B'.repeat(100),
            }));
        });
    });

    describe('logEvent() handles firebase errors gracefully', () => {
        beforeEach(() => {
            global.firebase = {
                apps: [{}],
                analytics: jest.fn().mockReturnValue({
                    logEvent: jest.fn().mockImplementation(() => {
                        throw new Error('Firebase quota exceeded');
                    }),
                }),
                initializeApp: jest.fn(),
            };
            const original = global.FIREBASE_CONFIG;
            global.FIREBASE_CONFIG = { ...original, measurementId: 'G-TEST12345' };
            Analytics.init();
            global.FIREBASE_CONFIG = original;
        });

        afterEach(() => {
            delete global.firebase;
        });

        test('does not throw when firebase.analytics().logEvent throws', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            expect(() => Analytics.trackLevelLoaded('2026-01-01', false)).not.toThrow();
            warnSpy.mockRestore();
        });
    });
});
