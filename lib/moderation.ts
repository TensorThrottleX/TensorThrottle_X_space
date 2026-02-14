// Enterprise Moderation Dataset
const MODERATION_DATASET = {
    severity_3_extreme: [
        // Direct violence / death wishes
        'kill yourself', 'kys', 'go die', 'drop dead', 'i will kill you',
        'i will hurt you', 'burn in hell', 'hang yourself', 'shoot yourself',
        'i hope you die', 'you deserve to die', 'lynch you', 'execute you',
        // Severe sexual abuse terms
        'rape you', 'rapist', 'molest you', 'pedophile', 'sex slave',
        // Explicit threats
        'i will find you', 'i know where you live', 'i will track you', 'you are dead',

        // Hindi - Extreme sexual/violent abuse
        'madarchod', 'behenchod', 'gand mar dunga', 'jaan se maar dunga', 'maar dunga',
        'tera rape karunga', 'bhosdike', 'randi ke bachhe', 'maa ki chut', 'behen ki chut',
        'chut ka bachha', 'gaand faad dunga', 'tera khoon kar dunga', 'zinda jala dunga', 'latka dunga',

        // Hindi - Threats (Severity 3 equivalent)
        'dekh lunga tujhe', 'ghar aa ja', 'bahar mil', 'dekh lunga baad mein',
        'tera game khatam', 'teri vaat laga dunga'
    ],
    severity_2_high: [
        // Strong profanity
        'fuck you', 'motherfucker', 'piece of shit', 'dumbass', 'bitch', 'asshole',
        'bastard', 'cunt', 'slut', 'whore', 'retard', 'retarded', 'scumbag',
        'dipshit', 'prick', 'garbage human',
        // Aggressive harassment
        'you are worthless', 'waste of oxygen', 'nobody likes you', 'you are useless',
        'no one cares about you', 'you are pathetic', 'you are disgusting',
        'shut up idiot', 'attention seeker', 'clown', 'loser', 'trash human',

        // Hindi - Strong insults
        'chutia', 'chutiya', 'chutiye', 'haramkhor', 'haraami', 'kamina', 'nalayak',
        'bewakoof', 'pagal hai kya', 'saale', 'kutte', 'kamine', 'gandu', 'bakchod',
        'bakchodi', 'jhantu', 'tatti insaan', 'ghatiya insaan', 'gawar', 'bhikari'
    ],
    severity_1_moderate: [
        // Mild profanity
        'damn you', 'hell no', 'screw you', 'shut up', 'what the hell',
        'bloody idiot', 'stupid', 'idiot', 'moron', 'jerk', 'annoying', 'creep',
        // Passive aggressive toxicity
        'nobody asked', 'who cares', 'this is garbage', 'you are embarrassing',
        'learn something first', 'this is pathetic', 'stop talking', 'go away'
        // Note: Hate patterns from previous logic can be integrated here or in high severity
        // Adding previous hate patterns to severity 2/3 as they are usually high risk
        , 'nigga', 'nigger', 'faggot', 'tranny', 'dyke', 'kike', 'chink', 'wetback',

        // Hindi - Mild insults / passive aggressive
        'faltu', 'bekar', 'bakwas', 'chup ho ja', 'dimag kharab hai', 'sharam karo',
        'kuch nahi aata', 'nikal yahan se', 'time waste', 'faltu aadmi', 'buddhu', 'ullu'
    ],
    spam_patterns: [
        'buy now', 'click here', 'limited offer', 'free money', 'earn cash fast',
        'crypto giveaway', 'investment opportunity', 'double your income',
        '100 percent profit', 'work from home and earn', 'dm me for offer',
        'telegram link', 'whatsapp me', 'exclusive deal',
        'contact me privately', 'send details in dm', 'urgent response needed',
        'act immediately',

        // Hindi Spam
        'paise kamao ghar baithe', 'free recharge', 'investment scheme',
        'crypto paisa double', 'telegram join karo', 'whatsapp karo',
        'dm karo details ke liye', 'jaldi karo offer limited'
    ]
}

const SUSPICIOUS_DOMAINS = [
    '.xyz', '.top', '.gq', '.tk', '.ml', '.ga', '.cf'
]

// Regex generation for variant matching (e.g., 'fuck' -> /f[\W_]*u[\W_]*c[\W_]*k/i)
function createVariantRegex(phrase: string): RegExp {
    // Escape regex special characters
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Insert flexible text matching between characters
    // Match any non-word char or underscore between letters
    const pattern = escaped.split('').join('[\\W_]*');
    return new RegExp(pattern, 'i');
}

// Pre-compile checks to avoid regex overhead on every request if possible, 
// but for flexibility we might generate on fly or cache. 
// Given the list size (~50 items), runtime generation is acceptable, but caching is better.
const DATASET_CHECKERS = {
    severity_3: MODERATION_DATASET.severity_3_extreme.map(createVariantRegex),
    severity_2: MODERATION_DATASET.severity_2_high.map(createVariantRegex),
    severity_1: MODERATION_DATASET.severity_1_moderate.map(createVariantRegex),
    spam: MODERATION_DATASET.spam_patterns.map(createVariantRegex)
}

// Previous helpers
export interface ClientMetrics {
    typingTime: number
    charCount: number
    backspaceCount: number
    pasteCount: number
    mouseEvents: number
    focusEvents: number
    kpm: number
    deviceHash: string
}

export interface ModerationResult {
    approved: boolean
    riskScore: number
    shadowBan: boolean
    reason: string[]
    metadata: {
        entropy: number
        uppercaseRatio: number
        linkCount: number
        profanityCount: number
        severityMatches: {
            sev1: number
            sev2: number
            sev3: number
            spam: number
        }
    }
}

export function calculateTextEntropy(text: string): number {
    const len = text.length
    if (len === 0) return 0
    const frequencies = new Map<string, number>()
    for (const char of text) frequencies.set(char, (frequencies.get(char) || 0) + 1)
    let entropy = 0
    for (const count of frequencies.values()) {
        const p = count / len
        entropy -= p * Math.log2(p)
    }
    return entropy
}

export function normalizeText(text: string): string {
    return text.toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[@!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '')
        .replace(/\s+/g, '')
        .replace(/4/g, 'a').replace(/1/g, 'i').replace(/0/g, 'o')
        .replace(/3/g, 'e').replace(/5/g, 's').replace(/8/g, 'b')
}

export async function moderateComment(
    message: string,
    name: string,
    metrics: ClientMetrics,
    ipDetails: { ip: string, userAgent: string },
    previousCommentsFromServer: any[] = []
): Promise<ModerationResult> {
    const result: ModerationResult = {
        approved: true,
        riskScore: 0,
        shadowBan: false,
        reason: [],
        metadata: {
            entropy: 0,
            uppercaseRatio: 0,
            linkCount: 0,
            profanityCount: 0,
            severityMatches: { sev1: 0, sev2: 0, sev3: 0, spam: 0 }
        }
    }

    // 1. TEXT ANALYSIS
    const normalizedMsg = normalizeText(message)
    const normalizedName = normalizeText(name)
    // Also keep raw text for regex matching which handles spacing/variants better than simple normalize
    const rawText = (message + " " + name).toLowerCase()

    // --- SEVERITY CHECKS ---

    // Severity 3 (Extreme) -> +10 risk each
    DATASET_CHECKERS.severity_3.forEach((regex, idx) => {
        if (regex.test(rawText) || regex.test(normalizedMsg)) {
            result.riskScore += 10
            result.metadata.severityMatches.sev3++
            result.reason.push(`Extreme toxicity: ${MODERATION_DATASET.severity_3_extreme[idx]}`)
        }
    })

    // Severity 2 (High) -> +5 risk each
    DATASET_CHECKERS.severity_2.forEach((regex, idx) => {
        if (regex.test(rawText) || regex.test(normalizedMsg)) {
            result.riskScore += 5
            result.metadata.severityMatches.sev2++
            // Don't leak specific matched word in reason if we want to be mysterious, 
            // but explicit reasons help admin.
            if (!result.reason.includes('High toxicity')) result.reason.push('High toxicity')
        }
    })

    // Severity 1 (Moderate) -> +2 risk each
    DATASET_CHECKERS.severity_1.forEach((regex, idx) => {
        if (regex.test(rawText) || regex.test(normalizedMsg)) {
            result.riskScore += 2
            result.metadata.severityMatches.sev1++
            if (!result.reason.includes('Moderate toxicity')) result.reason.push('Moderate toxicity')
        }
    })

    // Spam -> +4 risk each
    DATASET_CHECKERS.spam.forEach((regex, idx) => {
        if (regex.test(rawText)) {
            result.riskScore += 4
            result.metadata.severityMatches.spam++
            if (!result.reason.includes('Spam pattern')) result.reason.push('Spam pattern')
        }
    })

    // --- AGGRESSIVE REPETITION / SUSPICIOUS PATTERNS ---
    // "!!!!", "????", "aaaaaa"
    if (/!{3,}|\?{3,}|(.)\1{4,}/.test(message)) {
        result.riskScore += 3
        result.reason.push('Aggressive punctuation/repetition')
    }


    // --- ENTROPY & UPPERCASE ---
    const uppercaseCount = message.replace(/[^A-Z]/g, '').length
    const uppercaseRatio = message.length > 0 ? uppercaseCount / message.length : 0
    result.metadata.uppercaseRatio = uppercaseRatio

    if (uppercaseRatio > 0.6 && message.length > 10) {
        result.riskScore += 3
        result.reason.push('Excessive uppercase')
    }

    const entropy = calculateTextEntropy(message)
    result.metadata.entropy = entropy

    if (entropy < 1.5 && message.length > 20) {
        result.riskScore += 3
        result.reason.push('Low entropy (repetitive)')
    }
    if (entropy > 5.5) {
        result.riskScore += 2
        result.reason.push('High entropy (gibberish)')
    }

    // --- LINKS ---
    const linkMatches = message.match(/https?:\/\/[^\s]+/g) || []
    result.metadata.linkCount = linkMatches.length

    if (linkMatches.length > 0) {
        result.riskScore += 2 * linkMatches.length

        // Check for suspicious domains
        const hasSuspiciousLink = linkMatches.some(link =>
            SUSPICIOUS_DOMAINS.some(domain => link.includes(domain))
        )
        if (hasSuspiciousLink) {
            result.riskScore += 5
            result.reason.push('Suspicious link domain')
        }
    }

    // --- BEHAVIORAL ANALYSIS ---

    // Typing Speed / Copy Paste
    // Cap typing speed penalty to avoid banning fast typers who are legit
    if (metrics.typingTime < 1000 && message.length > 50) {
        if (metrics.pasteCount === 0) {
            // Impossible typing speed without paste
            result.riskScore += 10
            result.reason.push('Bot-like typing speed')
        } else {
            // Pasted content -> Slight risk increase, normalized
            result.riskScore += 1
        }
    }

    if (metrics.mouseEvents < 5 && metrics.focusEvents === 0) {
        result.riskScore += 4
        result.reason.push('No human interaction')
    }

    // --- FINAL DECISION ---

    // Thresholds:
    // Risk >= 15 -> Hard block (Block device in future logic, here just reject)
    // Risk >= 8  -> Soft reject (Shadow ban)

    if (result.riskScore >= 15) {
        result.approved = false
        result.shadowBan = false // Hard reject
    } else if (result.riskScore >= 8) {
        result.approved = true
        result.shadowBan = true // Soft reject (Shadow ban)
    }

    return result
}
