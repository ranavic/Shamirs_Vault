// Polyfill for Node.js crypto module in browser
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;

    if (!window.process) {
        window.process = { env: {}, version: '' };
    }
}
