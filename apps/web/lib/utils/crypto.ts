import CryptoJS from 'crypto-js';

/**
 * Crypto utility for hashing and encryption
 * Used primarily for duplicate detection via content hashing
 */

/**
 * Generate SHA256 hash of a string
 * Used for duplicate detection (content_hash, title_hash, url_hash)
 */
export function generateHash(input: string): string {
    if (!input) return '';

    // Normalize whitespace and convert to lowercase for consistent hashing
    const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');

    return CryptoJS.SHA256(normalized).toString();
}

/**
 * Generate MD5 hash (faster, for less critical hashing)
 */
export function generateMD5(input: string): string {
    if (!input) return '';
    return CryptoJS.MD5(input).toString();
}

/**
 * Encrypt sensitive data (e.g., API keys)
 * Note: In production, consider using Supabase Vault or environment variables
 */
export function encrypt(text: string, secret?: string): string {
    const encryptionKey = secret || process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production';
    return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

/**
 * Decrypt sensitive data
 */
export function decrypt(ciphertext: string, secret?: string): string {
    try {
        const encryptionKey = secret || process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production';
        const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}

/**
 * Calculate similarity between two strings (0-1 score)
 * Simple implementation using character overlap
 * For more sophisticated similarity, consider using libraries like 'string-similarity'
 */
export function calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    // Simple character-based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * Helper for similarity calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}
