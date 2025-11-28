import secrets from 'secrets.js-grempe';

// Generate a random 256-bit key (returned as hex string)
export const generateMasterKey = () => {
    return secrets.random(256); // secrets.js uses a CSPRNG
};

// Split the hex key into shares
export const splitKey = (key, shares, threshold) => {
    return secrets.share(key, shares, threshold);
};

// Reconstruct the key from shares
export const combineShares = (shares) => {
    return secrets.combine(shares);
};

// Encrypt secret using AES-GCM
export const encryptSecret = async (secret, keyHex) => {
    const enc = new TextEncoder();
    const keyData = hexToBytes(keyHex);

    // Import the key
    const key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        "AES-GCM",
        false,
        ["encrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedSecret = enc.encode(secret);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedSecret
    );

    // Return IV + Ciphertext as hex
    const ivHex = bytesToHex(iv);
    const cipherHex = bytesToHex(new Uint8Array(ciphertext));
    return `${ivHex}:${cipherHex}`;
};

// Decrypt secret using AES-GCM
export const decryptSecret = async (encryptedData, keyHex) => {
    try {
        const [ivHex, cipherHex] = encryptedData.split(':');
        if (!ivHex || !cipherHex) throw new Error("Invalid encrypted data format");

        const keyData = hexToBytes(keyHex);
        const iv = hexToBytes(ivHex);
        const ciphertext = hexToBytes(cipherHex);

        const key = await window.crypto.subtle.importKey(
            "raw",
            keyData,
            "AES-GCM",
            false,
            ["decrypt"]
        );

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        throw new Error("Decryption failed. Wrong key or corrupted data.");
    }
};

// Helpers
const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
};

const bytesToHex = (bytes) => {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};
