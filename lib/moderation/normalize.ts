export function normalizeText(text: string): string {
    if (!text) return "";

    let normalized = text.toLowerCase();

    // Leetspeak replacements
    // @->a, 1->i, 0->o, $->s
    normalized = normalized
        .replace(/@/g, "a")
        .replace(/1/g, "i")
        .replace(/0/g, "o")
        .replace(/\$/g, "s");

    // Remove punctuation spacing between letters
    // Instead of complex logic, removing all non-alphanumeric (except space)
    // handles "f.u.c.k" -> "fuck" and "hello, world" -> "hello world"
    // nicely for toxicity detection content.
    normalized = normalized.replace(/[^\w\s]|_/g, "");

    // Collapse repeated characters
    // e.g. "chuuutiya" -> "chutiya"
    normalized = normalized.replace(/(.)\1+/g, "$1");

    return normalized.trim();
}
