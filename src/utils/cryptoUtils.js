/**
 * Utility for hashing a 4-digit PIN using standard Web Crypto API (SHA-256).
 * This ensures plain text PINs are never stored in LocalStorage.
 * 
 * @param {string} pin - Plain text 4-digit PIN.
 * @returns {Promise<string>} Hex representation of the SHA-256 hash.
 */
export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
