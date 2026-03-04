/**
 * CloudMigration Tests
 *
 * Verifies the schema versioning and migration logic for cloud-synced
 * submission data.
 */

const CloudMigration = require('../../js/CloudMigration.js');

describe('CloudMigration', () => {
    describe('CURRENT_VERSION', () => {
        test('is defined as a non-empty string', () => {
            expect(typeof CloudMigration.CURRENT_VERSION).toBe('string');
            expect(CloudMigration.CURRENT_VERSION.length).toBeGreaterThan(0);
        });

        test('is "1.1"', () => {
            expect(CloudMigration.CURRENT_VERSION).toBe('1.1');
        });
    });

    describe('getVersion()', () => {
        test('returns "1.0" for objects without __version field', () => {
            expect(CloudMigration.getVersion({ score: 5 })).toBe('1.0');
        });

        test('returns "1.0" for null/undefined', () => {
            expect(CloudMigration.getVersion(null)).toBe('1.0');
            expect(CloudMigration.getVersion(undefined)).toBe('1.0');
        });

        test('returns the __version value when present', () => {
            expect(CloudMigration.getVersion({ __version: '1.1' })).toBe('1.1');
        });
    });

    describe('migrateSubmission()', () => {
        test('handles null gracefully', () => {
            expect(CloudMigration.migrateSubmission(null)).toBeNull();
        });

        test('handles non-objects gracefully', () => {
            expect(CloudMigration.migrateSubmission('string')).toBe('string');
        });

        // ── v1.0 → v1.1 ──────────────────────────────────────────────────────
        describe('v1.0 → v1.1', () => {
            test('adds hintsUsed: [] to a v1.0 document', () => {
                const v10 = { score: 15, walls: [[1, 2]], timestamp: '2026-01-01T00:00:00.000Z', time: 60 };
                const result = CloudMigration.migrateSubmission(v10);
                expect(result.hintsUsed).toEqual([]);
            });

            test('sets __version to "1.1" on a v1.0 document', () => {
                const v10 = { score: 15, walls: [], timestamp: '2026-01-01T00:00:00.000Z', time: 60 };
                const result = CloudMigration.migrateSubmission(v10);
                expect(result.__version).toBe('1.1');
            });

            test('preserves all existing v1.0 fields', () => {
                const v10 = { score: 15, walls: [[1, 2]], timestamp: '2026-01-01T00:00:00.000Z', time: 60 };
                const result = CloudMigration.migrateSubmission(v10);
                expect(result.score).toBe(15);
                expect(result.walls).toEqual([[1, 2]]);
                expect(result.timestamp).toBe('2026-01-01T00:00:00.000Z');
                expect(result.time).toBe(60);
            });

            test('preserves existing hintsUsed if already populated in v1.0 data', () => {
                // Edge case: corrupted/partially-migrated data that already has hintsUsed
                const v10WithHints = {
                    score: 10,
                    walls: [],
                    timestamp: '2026-01-01T00:00:00.000Z',
                    time: 30,
                    hintsUsed: ['checked'],
                };
                const result = CloudMigration.migrateSubmission(v10WithHints);
                expect(result.hintsUsed).toEqual(['checked']);
            });

            test('does not mutate the original object', () => {
                const v10 = { score: 5, walls: [], timestamp: '', time: 0 };
                CloudMigration.migrateSubmission(v10);
                expect(v10.__version).toBeUndefined();
                expect(v10.hintsUsed).toBeUndefined();
            });
        });

        // ── Already at current version ────────────────────────────────────────
        describe('v1.1 (no-op)', () => {
            test('returns v1.1 data unchanged', () => {
                const v11 = {
                    __version: '1.1',
                    score: 12,
                    walls: [[3, 4]],
                    timestamp: '2026-02-01T00:00:00.000Z',
                    time: 90,
                    hintsUsed: ['checked', 'target'],
                };
                const result = CloudMigration.migrateSubmission(v11);
                expect(result).toEqual(v11);
            });

            test('does not add duplicate hintsUsed entries', () => {
                const v11 = {
                    __version: '1.1',
                    score: 8,
                    walls: [],
                    timestamp: '',
                    time: 0,
                    hintsUsed: ['checked'],
                };
                const result = CloudMigration.migrateSubmission(v11);
                expect(result.hintsUsed).toEqual(['checked']);
            });
        });
    });
});
