
// Simple browser fingerprinting (Privacy-respecting but sufficient for bot detection)

export async function getBrowserFingerprint(): Promise<string> {
    if (typeof window === 'undefined') return 'server-side';

    // 1. Basic properties
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency;
    const deviceMemory = (navigator as any).deviceMemory;
    const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 2. Canvas Fingerprint
    let canvasHash = '';
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = 200;
            canvas.height = 50;
            ctx.textBaseline = "top";
            ctx.font = "16px Arial";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("TensorThrottleX", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("TensorThrottleX", 4, 17);
            canvasHash = canvas.toDataURL();
        }
    } catch (e) {
        canvasHash = 'canvas-blocked';
    }

    // Combine all factors
    const components = [
        userAgent,
        language,
        platform,
        hardwareConcurrency,
        deviceMemory,
        screenRes,
        timezone,
        touchSupport,
        canvasHash
    ].join('||');

    // Simple hash (SHA-256 equivalent logic but using subtle crypto if available, else simple murmur)
    // Using subtle crypto for stability
    const msgBuffer = new TextEncoder().encode(components);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}
