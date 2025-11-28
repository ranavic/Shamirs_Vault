import secrets from './src/utils/secrets.js';
import crypto from 'crypto';

// Mock window.crypto for Node environment
if (typeof window === 'undefined') {
    global.window = {
        crypto: {
            getRandomValues: (array) => {
                const bytes = crypto.randomBytes(array.length);
                array.set(bytes);
                return array;
            }
        }
    };
}

console.log("Testing secrets.js internals...");

// Access internal config if possible? No, it's closed.
// But we can test arithmetic via public API if we export it, but we don't.
// So we test the end-to-end flow with debug prints.

// 1. Test Key Generation
const key = secrets.random(256); // 32 bytes = 64 hex chars
console.log("Key:", key);

// 2. Test Share
const shares = secrets.share(key, 5, 3);
console.log("Shares:", shares);

// 3. Test Combine
try {
    const combined = secrets.combine(shares.slice(0, 3));
    console.log("Combined:", combined);

    if (key === combined) {
        console.log("SUCCESS: Keys match!");
    } else {
        console.error("FAILURE: Keys do not match!");
        console.log("Key Length:", key.length);
        console.log("Combined Length:", combined.length);

        // Check first byte
        const k1 = parseInt(key.substr(0, 2), 16);
        const c1 = parseInt(combined.substr(0, 2), 16);
        console.log(`First byte: Original=${k1}, Reconstructed=${c1}`);
    }
} catch (e) {
    console.error("Error during combine:", e);
}
