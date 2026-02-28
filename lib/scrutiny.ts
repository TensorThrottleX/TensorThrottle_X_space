/**
 * SECURE_CHANNEL > TRANSMISSION_SCRUTINY_CORE
 * 
 * Logic for real-time message evaluation, profanity detection, 
 * and abuse mitigation.
 */

export type ScrutinyLevel = 0 | 1 | 2 | 3;

export interface ScrutinyResult {
    level: ScrutinyLevel;
    score: number;
    violations: string[];
    offendingWords: string[];
}

// --- DICTIONARIES ---

const SEVERE_PROFANITY = [
    'fuck', 'shit', 'nigger', 'faggot', 'cunt', 'dick', 'pussy',
    'motherfucker', 'bastard', 'asshole', 'bitch', 'prick', 'slut', 'whore'
];

const HINDI_PROFANITY = [
    'madarchod', 'mc', 'bc', 'bhenchod', 'chutiya', 'gandu', 'harami', 'bhosdike', 'behenchod', 'randi', 'saala', 'sala',
    'मादरचोद', 'चूतिया', 'गांडू', 'हरामी', 'भोसड़ीके', 'साला', 'रण्डी'
];

// --- UTILITIES ---

// Cache for pre-compiled obfuscation regexes to avoid expensive runtime creation
const OBFUSCATED_REGEX_CACHE = new Map<string, RegExp>();

/**
 * Advanced normalization for abuse detection
 */
function normalizeForScrutiny(text: string): string {
    return text
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .toLowerCase()
        // Leetspeak mapping
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/!/g, 'i')
        // Remove common separators
        .replace(/[\.\-\_\*\/\\\|\s]/g, '');
}

/**
 * Generates or retrieves a cached regex for detecting obfuscated words
 */
function getObfuscatedRegex(word: string): RegExp {
    if (OBFUSCATED_REGEX_CACHE.has(word)) {
        return OBFUSCATED_REGEX_CACHE.get(word)!;
    }

    // Escape word and add optional separators between every character
    const pattern = word
        .split('')
        .map(char => `${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\W_]*`)
        .join('');

    const regex = new RegExp(pattern, 'gi');
    OBFUSCATED_REGEX_CACHE.set(word, regex);
    return regex;
}

// --- ENGINES ---

/**
 * Detects patterns indicative of bots or automation
 */
function runBotPatternEngine(text: string): { score: number; violations: string[] } {
    let score = 0;
    const violations: string[] = [];

    // 1. Excessive Repetition (characters)
    if (/(.)\1{7,}/.test(text)) {
        score += 5;
        violations.push("Repetition anomaly (chars)");
    }

    // 2. Word Repetition
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCounts: Record<string, number> = {};
    words.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);
    if (Object.values(wordCounts).some(count => count > 8)) {
        score += 4;
        violations.push("Repetition anomaly (words)");
    }

    // 3. Excessive Uppercase (Aggression Detection)
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount > 10 && (upperCount / alphaCount) > 0.8) {
        score += 6;
        violations.push("Excessive aggressive uppercase");
    }

    return { score, violations };
}

/**
 * Detects abusive language with deep pattern matching
 */
function runProfanityEngine(text: string): { score: number; violations: string[]; offendingWords: string[] } {
    let score = 0;
    const violations: string[] = [];
    const offendingWords: string[] = [];

    const normalizedMerged = normalizeForScrutiny(text);

    // Deep Scan: Check for severe words in merged/normalized text
    SEVERE_PROFANITY.concat(HINDI_PROFANITY).forEach(word => {
        // Direct match in normalized merged text
        if (normalizedMerged.includes(word.toLowerCase())) {
            score += 10;
            offendingWords.push(word);
        }
    });

    // Pattern Scan: Check for character-separated variants in original text
    SEVERE_PROFANITY.forEach(word => {
        const regex = getObfuscatedRegex(word);
        if (regex.test(text)) {
            // Already counted if caught by normalizedMerged if it was just symbols, 
            // but this catches complex spacing
            if (!offendingWords.includes(word)) {
                score += 10;
                offendingWords.push(word);
            }
        }
    });

    if (offendingWords.length > 0) {
        violations.push("Abusive language detected");
    }

    return { score, violations, offendingWords };
}

// --- MAIN ANALYZER ---

export function analyzeMessage(text: string | undefined): ScrutinyResult {
    if (!text || !text.trim()) {
        return { level: 0, score: 0, violations: [], offendingWords: [] };
    }

    const bot = runBotPatternEngine(text);
    const profanity = runProfanityEngine(text);

    const totalScore = bot.score + profanity.score;
    const allViolations = Array.from(new Set([...bot.violations, ...profanity.violations]));

    // Strict Level Assignment
    // Level 2+ disables transmission
    let level: ScrutinyLevel = 0;
    if (profanity.score >= 10 || totalScore >= 20) level = 3;
    else if (totalScore >= 10) level = 2;
    else if (totalScore >= 5) level = 1;

    return {
        level,
        score: totalScore,
        violations: allViolations,
        offendingWords: profanity.offendingWords
    };
}

