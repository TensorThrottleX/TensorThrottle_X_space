const SEVERE_TERMS = [
    "madarchod",
    "bhenchod",
    "chutiya",
    "motherfucker",
    "fucking",
    "fuck",
    "shit",
    "bastard",
    "asshole",
    "kill yourself",
    "die",
    "nigger",
    "faggot",
    "retard",
    "cunt",
    "whore",
    "slut",
    "dick",
    "pussy",
    "cock",
    "suck",
    "anal",
    "rape",
    "sex",
    "porn",
    "xxx",
    "bitch",
    "stupid", // context dependent, but often abusive
    "idiot",
    "scam",
    "useless",
    "मादरचोद", "चूतिया", "गांडू", "हरामी", "भोसड़ीके", "साला", "रण्डी", "behenchod", "mc", "bc", "gandu", "harami", "bhosdike", "randi", "saala"
];

export function getProfanityBoost(normalizedText: string): { high: number, moderate: number } {
    let found = false;

    // Check for presence of any severe term
    // We use simple substring matching on the normalized text to catch obfuscated/embedded terms
    for (const term of SEVERE_TERMS) {
        if (normalizedText.includes(term)) {
            found = true;
            break;
        }
    }

    if (found) {
        return { high: 0.25, moderate: 0.15 };
    }

    return { high: 0, moderate: 0 };
}
