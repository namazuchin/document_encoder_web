/**
 * Encryption Service
 *
 * Provides secure encryption/decryption for sensitive data (e.g., API keys)
 * using Web Crypto API with PBKDF2 key derivation and AES-GCM encryption.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a device-specific fingerprint to use as encryption key material.
 * This uses various browser/system properties to create a semi-stable identifier.
 * Note: This is NOT meant for cross-device sync, but for local encryption.
 */
async function getDeviceFingerprint(): Promise<string> {
    const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset().toString(),
        screen.colorDepth.toString(),
        screen.width.toString(),
        screen.height.toString(),
    ];

    // Add a stable component from localStorage (create if doesn't exist)
    const DEVICE_ID_KEY = 'doc_encoder_device_id';
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        // Generate a random device ID on first run
        deviceId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    components.push(deviceId);

    return components.join('|');
}

/**
 * Derive an encryption key from the device fingerprint using PBKDF2
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    const fingerprint = await getDeviceFingerprint();
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(fingerprint),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a string value
 * @param plaintext The string to encrypt
 * @returns Base64-encoded encrypted data with salt and IV
 */
export async function encrypt(plaintext: string): Promise<string> {
    if (!plaintext) return '';

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive key from device fingerprint + salt
    const key = await deriveKey(salt);

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv,
        },
        key,
        data
    );

    // Combine salt + IV + encrypted data
    const combined = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an encrypted string
 * @param encryptedBase64 Base64-encoded encrypted data with salt and IV
 * @returns Decrypted plaintext string
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
    if (!encryptedBase64) return '';

    try {
        // Decode from base64
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

        // Extract salt, IV, and encrypted data
        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const encryptedData = combined.slice(SALT_LENGTH + IV_LENGTH);

        // Derive the same key using the stored salt
        const key = await deriveKey(salt);

        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv,
            },
            key,
            encryptedData
        );

        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data. The data may be corrupted or the device fingerprint may have changed.');
    }
}

/**
 * Check if a value appears to be encrypted (base64 format check)
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;

    // Check if it's valid base64 and has sufficient length for salt+iv+data
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(value)) return false;

    try {
        const decoded = atob(value);
        // Should be at least salt + iv + some encrypted data
        return decoded.length >= SALT_LENGTH + IV_LENGTH + 16;
    } catch {
        return false;
    }
}

export const EncryptionService = {
    encrypt,
    decrypt,
    isEncrypted,
};
