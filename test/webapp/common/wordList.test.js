/**
 * Unit Tests for wordList.js
 * 
 * Tests the word list functionality and word retrieval functions.
 */

const { WORD_LIST, getRandomWord, getWordCount, getWordAtIndex, generateLevelName } = require('../../../js/generation/wordList.js');

describe('WORD_LIST', () => {
    describe('Structure', () => {
        test('should be an array', () => {
            expect(Array.isArray(WORD_LIST)).toBe(true);
        });

        test('should not be empty', () => {
            expect(WORD_LIST.length).toBeGreaterThan(0);
        });

        test('should have a reasonable number of words (50-300)', () => {
            expect(WORD_LIST.length).toBeGreaterThanOrEqual(50);
            expect(WORD_LIST.length).toBeLessThanOrEqual(300);
        });
    });

    describe('Word Validation', () => {
        test('all elements should be strings', () => {
            WORD_LIST.forEach(word => {
                expect(typeof word).toBe('string');
            });
        });

        test('all strings should be non-empty', () => {
            WORD_LIST.forEach(word => {
                expect(word.length).toBeGreaterThan(0);
            });
        });

        test('all strings should start with uppercase letter', () => {
            WORD_LIST.forEach(word => {
                expect(word[0]).toMatch(/[A-Z]/);
            });
        });

        test('all strings should be valid words (only letters)', () => {
            WORD_LIST.forEach(word => {
                expect(word).toMatch(/^[A-Za-z]+$/);
            });
        });

        test('no duplicate words', () => {
            const uniqueWords = new Set(WORD_LIST);
            expect(uniqueWords.size).toBe(WORD_LIST.length);
        });

        test('words should have reasonable length (3-15 characters)', () => {
            WORD_LIST.forEach(word => {
                expect(word.length).toBeGreaterThanOrEqual(3);
                expect(word.length).toBeLessThanOrEqual(15);
            });
        });
    });
});

describe('getRandomWord()', () => {
    test('should return a string', () => {
        const word = getRandomWord();
        expect(typeof word).toBe('string');
    });

    test('should return a word from WORD_LIST', () => {
        const word = getRandomWord();
        expect(WORD_LIST).toContain(word);
    });

    test('should return different words on multiple calls (probabilistic)', () => {
        // With 100+ words, very unlikely to get same word 10 times
        const words = new Set();
        for (let i = 0; i < 10; i++) {
            words.add(getRandomWord());
        }
        // At least 2 different words should appear in 10 calls
        expect(words.size).toBeGreaterThanOrEqual(2);
    });

    test('should not return null or undefined', () => {
        const word = getRandomWord();
        expect(word).not.toBeNull();
        expect(word).not.toBeUndefined();
    });

    test('should return words with proper distribution (over many calls)', () => {
        const wordCounts = {};
        const iterations = 1000;
        
        for (let i = 0; i < iterations; i++) {
            const word = getRandomWord();
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }

        // All words should have at least one occurrence (highly probable)
        // or at least 80% of words should appear
        const wordsAppeared = Object.keys(wordCounts).length;
        expect(wordsAppeared).toBeGreaterThan(WORD_LIST.length * 0.8);
    });
});

describe('getWordCount()', () => {
    test('should return a number', () => {
        const count = getWordCount();
        expect(typeof count).toBe('number');
    });

    test('should return the correct length of WORD_LIST', () => {
        const count = getWordCount();
        expect(count).toBe(WORD_LIST.length);
    });

    test('should return a positive number', () => {
        const count = getWordCount();
        expect(count).toBeGreaterThan(0);
    });

    test('should return the same value on multiple calls', () => {
        const count1 = getWordCount();
        const count2 = getWordCount();
        expect(count1).toBe(count2);
    });
});

describe('getWordAtIndex()', () => {
    test('should return a string for valid index', () => {
        const word = getWordAtIndex(0);
        expect(typeof word).toBe('string');
    });

    test('should return the correct word at index 0', () => {
        const word = getWordAtIndex(0);
        expect(word).toBe(WORD_LIST[0]);
    });

    test('should return the correct word at last index', () => {
        const lastIndex = WORD_LIST.length - 1;
        const word = getWordAtIndex(lastIndex);
        expect(word).toBe(WORD_LIST[lastIndex]);
    });

    test('should return the correct word at middle index', () => {
        const middleIndex = Math.floor(WORD_LIST.length / 2);
        const word = getWordAtIndex(middleIndex);
        expect(word).toBe(WORD_LIST[middleIndex]);
    });

    test('should return undefined for negative index', () => {
        const word = getWordAtIndex(-1);
        expect(word).toBeUndefined();
    });

    test('should return undefined for out-of-bounds index', () => {
        const word = getWordAtIndex(WORD_LIST.length);
        expect(word).toBeUndefined();
    });

    test('should return undefined for very large index', () => {
        const word = getWordAtIndex(99999);
        expect(word).toBeUndefined();
    });

    test('should return consistent results for same index', () => {
        const index = 5;
        const word1 = getWordAtIndex(index);
        const word2 = getWordAtIndex(index);
        expect(word1).toBe(word2);
    });

    test('should work for all valid indices', () => {
        for (let i = 0; i < WORD_LIST.length; i++) {
            const word = getWordAtIndex(i);
            expect(word).toBe(WORD_LIST[i]);
        }
    });
});

describe('Word List Content Categories', () => {
    test('should contain nature words', () => {
        const natureWords = ['Meadow', 'River', 'Forest', 'Mountain', 'Ocean'];
        const hasNatureWords = natureWords.some(word => WORD_LIST.includes(word));
        expect(hasNatureWords).toBe(true);
    });

    test('should contain animal words', () => {
        const animalWords = ['Eagle', 'Tiger', 'Wolf', 'Dolphin'];
        const hasAnimalWords = animalWords.some(word => WORD_LIST.includes(word));
        expect(hasAnimalWords).toBe(true);
    });

    test('should contain color words', () => {
        const colorWords = ['Crimson', 'Azure', 'Emerald', 'Violet'];
        const hasColorWords = colorWords.some(word => WORD_LIST.includes(word));
        expect(hasColorWords).toBe(true);
    });
});

describe('generateLevelName()', () => {
    test('should return a string', () => {
        const name = generateLevelName();
        expect(typeof name).toBe('string');
    });

    test('should return a two-word name separated by a space', () => {
        const name = generateLevelName();
        const parts = name.split(' ');
        expect(parts).toHaveLength(2);
    });

    test('both words should come from WORD_LIST', () => {
        const name = generateLevelName();
        const [first, second] = name.split(' ');
        expect(WORD_LIST).toContain(first);
        expect(WORD_LIST).toContain(second);
    });

    test('should not use the same word twice', () => {
        for (let i = 0; i < 20; i++) {
            const name = generateLevelName();
            const [first, second] = name.split(' ');
            expect(first).not.toBe(second);
        }
    });

    test('should not return null or undefined', () => {
        const name = generateLevelName();
        expect(name).not.toBeNull();
        expect(name).not.toBeUndefined();
    });

    test('should produce varied names across multiple calls', () => {
        const names = new Set();
        for (let i = 0; i < 20; i++) {
            names.add(generateLevelName());
        }
        expect(names.size).toBeGreaterThanOrEqual(5);
    });

    test('should not contain a numbered suffix', () => {
        for (let i = 0; i < 20; i++) {
            const name = generateLevelName();
            expect(name).not.toMatch(/-\d+$/);
        }
    });
});
