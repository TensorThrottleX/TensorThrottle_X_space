// This script tests the moderation endpoint directly.
// Ensure the development server is running on localhost:3000.
// Usage: node scripts/test-moderation.js

const API_URL = 'http://localhost:3000/api/moderate';

async function testCase(label, text, expectedSeverity) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            console.error(`Status ${response.status} for "${text}". Error: ${response.statusText}`);
            const textResponse = await response.text();
            console.error('Response:', textResponse);
            return;
        }

        const data = await response.json();
        console.log(`\n--- Test: ${label} ---`);
        console.log(`Text: "${text}"`);
        console.log(`Severity: ${data.severity} (Expected: ${expectedSeverity})`);
        console.log(`Scores:`, data.scores);
        console.log(`Allowed: ${data.allow}`);

        if (data.severity === expectedSeverity) {
            console.log('PASS');
        } else {
            console.warn('FAIL');
        }

    } catch (error) {
        console.error(`Test ${label} Failed:`, error.message);
    }
}

async function runTests() {
    console.log('Running Moderation Tests against:', API_URL);

    // Normal Case
    await testCase('Normal', 'This is a great feature, I love it!', 'normal');

    // Moderate Case (Abusive language)
    await testCase('Moderate', 'You are stupid and your code is bad', 'moderate');

    // High Case (English Profanity)
    await testCase('High (English)', 'Go kill yourself you piece of shit', 'high');

    // High Case (Hindi Profanity)
    await testCase('High (Hindi)', 'madarchod aadmi hai tu', 'high');

    // Obfuscated
    await testCase('Obfuscated', 'f.u.c.k you', 'high'); // Should be high or moderate depending on model confidence

    // Leetspeak
    await testCase('Leetspeak', 'm@d@rch0d', 'high'); // Normalized to madarchod -> high boost lexicon
}

runTests();
