/**
 * SmartFill AI Assistant — Cryptographic Security & PIN Manager (crypto.js)
 * Implements Web Crypto PBKDF2 + SHA-256 for secure PIN hashing and session state.
 */

var CryptoManager = globalThis.CryptoManager || (function () {
  return {
    ITERATIONS: 100000,
    KEY_LEN: 256,
    SESSION_TIMEOUT_MS: 5 * 60 * 1000,

    generateSalt() {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    async hashPin(pin, saltHex) {
      const enc = new TextEncoder();
      const pinBuffer = enc.encode(pin);
      const saltBuffer = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      const baseKey = await crypto.subtle.importKey(
        'raw',
        pinBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: this.ITERATIONS,
          hash: 'SHA-256'
        },
        baseKey,
        this.KEY_LEN
      );

      const hashArray = Array.from(new Uint8Array(derivedKey));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async verifyPin(enteredPin, storedHash, saltHex) {
      if (!enteredPin || !storedHash || !saltHex) return false;
      try {
        const computedHash = await this.hashPin(enteredPin, saltHex);
        return computedHash === storedHash;
      } catch (e) {
        console.error('PIN verification error:', e);
        return false;
      }
    },

    async isSessionUnlocked() {
      try {
        const { pinConfig } = await chrome.storage.local.get('pinConfig');
        if (!pinConfig || !pinConfig.enabled) {
          return true;
        }

        const session = await chrome.storage.session.get(['unlockedUntil', 'lastActive']);
        const now = Date.now();

        if (session.unlockedUntil && session.unlockedUntil > now) {
          await chrome.storage.session.set({
            lastActive: now,
            unlockedUntil: now + this.SESSION_TIMEOUT_MS
          });
          return true;
        }

        return false;
      } catch (e) {
        console.warn('Session check fallback:', e);
        return false;
      }
    },

    async setSessionUnlocked() {
      const now = Date.now();
      await chrome.storage.session.set({
        lastActive: now,
        unlockedUntil: now + this.SESSION_TIMEOUT_MS
      });
    },

    async lockSession() {
      await chrome.storage.session.remove(['unlockedUntil', 'lastActive']);
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoManager;
} else {
  globalThis.CryptoManager = CryptoManager;
}
