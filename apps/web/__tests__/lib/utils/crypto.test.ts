import {
  generateHash,
  generateMD5,
  encrypt,
  decrypt,
  calculateSimilarity,
} from '@/lib/utils/crypto';

describe('Crypto Utilities', () => {
  describe('generateHash', () => {
    it('generates consistent SHA256 hashes for same input', () => {
      const hash1 = generateHash('test content');
      const hash2 = generateHash('test content');
      expect(hash1).toBe(hash2);
    });

    it('normalizes whitespace and case', () => {
      const hash1 = generateHash('Test Content');
      const hash2 = generateHash('test  content');
      const hash3 = generateHash('  TEST CONTENT  ');
      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('returns empty string for empty input', () => {
      expect(generateHash('')).toBe('');
    });

    it('generates different hashes for different content', () => {
      const hash1 = generateHash('content 1');
      const hash2 = generateHash('content 2');
      expect(hash1).not.toBe(hash2);
    });

    it('returns 64 character hex string (SHA256)', () => {
      const hash = generateHash('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('generateMD5', () => {
    it('generates consistent MD5 hashes', () => {
      const hash1 = generateMD5('test content');
      const hash2 = generateMD5('test content');
      expect(hash1).toBe(hash2);
    });

    it('returns empty string for empty input', () => {
      expect(generateMD5('')).toBe('');
    });

    it('returns 32 character hex string (MD5)', () => {
      const hash = generateMD5('test');
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('encrypt and decrypt', () => {
    const testSecret = 'test-secret-key';

    it('encrypts and decrypts text correctly', () => {
      const originalText = 'sensitive data';
      const encrypted = encrypt(originalText, testSecret);
      const decrypted = decrypt(encrypted, testSecret);
      expect(decrypted).toBe(originalText);
    });

    it('produces different ciphertext each time (random IV)', () => {
      const text = 'test text';
      const encrypted1 = encrypt(text, testSecret);
      const encrypted2 = encrypt(text, testSecret);
      // AES encryption should produce different results due to random IV
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('decrypts correctly regardless of encryption randomness', () => {
      const text = 'test text';
      const encrypted1 = encrypt(text, testSecret);
      const encrypted2 = encrypt(text, testSecret);
      expect(decrypt(encrypted1, testSecret)).toBe(text);
      expect(decrypt(encrypted2, testSecret)).toBe(text);
    });

    it('returns empty string for invalid decryption', () => {
      const result = decrypt('invalid-ciphertext', testSecret);
      expect(result).toBe('');
    });

    it('fails to decrypt with wrong key', () => {
      const encrypted = encrypt('secret', 'key1');
      const decrypted = decrypt(encrypted, 'wrong-key');
      expect(decrypted).not.toBe('secret');
    });
  });

  describe('calculateSimilarity', () => {
    it('returns 1 for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1);
    });

    it('returns 1 for same strings with different case', () => {
      expect(calculateSimilarity('Hello', 'hello')).toBe(1);
    });

    it('returns high similarity for same strings with whitespace differences', () => {
      // Note: calculateSimilarity does trim but doesn't normalize internal whitespace
      const similarity = calculateSimilarity('hello  world', '  hello world  ');
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('returns 0 for empty strings', () => {
      expect(calculateSimilarity('', 'hello')).toBe(0);
      expect(calculateSimilarity('hello', '')).toBe(0);
      expect(calculateSimilarity('', '')).toBe(0);
    });

    it('returns high similarity for similar strings', () => {
      const similarity = calculateSimilarity('hello world', 'hello world!');
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('returns low similarity for different strings', () => {
      const similarity = calculateSimilarity('hello', 'goodbye');
      expect(similarity).toBeLessThan(0.5);
    });

    it('returns moderate similarity for partially similar strings', () => {
      const similarity = calculateSimilarity('the quick brown fox', 'the slow brown cat');
      expect(similarity).toBeGreaterThan(0.4);
      expect(similarity).toBeLessThan(0.8);
    });

    it('handles long strings correctly', () => {
      const str1 = 'This is a very long string that contains a lot of text and should be compared';
      const str2 = 'This is a very long string that contains a lot of text and should be similar';
      const similarity = calculateSimilarity(str1, str2);
      expect(similarity).toBeGreaterThan(0.8);
    });
  });
});
