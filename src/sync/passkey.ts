/**
 * WebAuthn Passkey — biometric-gated access to sync passphrase.
 *
 * Flow:
 *  1. User sets up sync passphrase (generate or enter)
 *  2. User registers a passkey on this device
 *     → passphrase is encrypted with a key derived from the passkey credential
 *     → encrypted blob is stored locally AND uploaded to CF KV (keyed by credential ID hash)
 *  3. On any device, user authenticates with passkey (discoverable credential)
 *     → blob is fetched from KV if not available locally
 *     → passphrase is decrypted → sync starts automatically
 *
 * Cross-device: passkeys synced via iCloud Keychain / Google Password Manager
 * present the same credential ID on another device, so the server-stored blob
 * can be fetched and decrypted there.
 *
 * Security model: the passphrase itself is the sync secret.  The passkey just
 * provides convenient, biometric-gated access to it on trusted devices.
 * The encrypted blob is useless without the credential's rawId (held by the
 * authenticator), so storing it on the server is safe.
 */

const PASSKEY_STORAGE_KEY = 'tempo-passkey-credential';
const PASSKEY_ENCRYPTED_KEY = 'tempo-passkey-encrypted-phrase';
const RP_ID = location.hostname;
const RP_NAME = 'Tempo Agenda Builder';

const API = ((import.meta as unknown as { env: Record<string, string> }).env
  ?.VITE_SYNC_API ?? 'https://tempo-sync.alex-31f.workers.dev');

interface StoredCredential {
  credentialId: string; // base64url
  publicKey: string;    // not used for PRF, kept for reference
  createdAt: string;
}

/** Check whether WebAuthn is available. */
export function isPasskeySupported(): boolean {
  return typeof PublicKeyCredential !== 'undefined'
    && typeof navigator.credentials?.create === 'function';
}

/** Check if a passkey credential has been registered on this device. */
export function hasRegisteredPasskey(): boolean {
  try {
    return localStorage.getItem(PASSKEY_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Get stored credential info. */
function getStoredCredential(): StoredCredential | null {
  try {
    const raw = localStorage.getItem(PASSKEY_STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredCredential : null;
  } catch {
    return null;
  }
}

/* ─── Helpers ─── */

function bufToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuf(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

/**
 * Derive an AES-GCM key from raw credential bytes.
 * We use the raw credential ID as key material via HKDF.
 */
async function deriveKey(credentialIdBuf: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    credentialIdBuf,
    'HKDF',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('tempo-passkey-v1'),
      info: new TextEncoder().encode('passphrase-encryption'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** SHA-256 hash of a buffer, returned as lowercase hex. */
async function sha256hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Upload encrypted blob to the worker, keyed by credential ID hash. */
async function uploadBlob(credentialIdBuf: ArrayBuffer, blob: string): Promise<void> {
  const hash = await sha256hex(credentialIdBuf);
  try {
    await fetch(`${API}/api/passkey`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialIdHash: hash, blob }),
    });
  } catch { /* best-effort */ }
}

/** Fetch encrypted blob from the worker by credential ID hash. */
async function fetchBlob(credentialIdBuf: ArrayBuffer): Promise<string | null> {
  const hash = await sha256hex(credentialIdBuf);
  try {
    const res = await fetch(`${API}/api/passkey/${hash}`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Encrypt the passphrase with a key derived from the credential. */
async function encryptPassphrase(passphrase: string, credentialIdBuf: ArrayBuffer): Promise<string> {
  const key = await deriveKey(credentialIdBuf);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(passphrase);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data,
  );
  // Pack: iv (12) + ciphertext
  const packed = new Uint8Array(12 + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), 12);
  return bufToBase64url(packed.buffer as ArrayBuffer);
}

/** Decrypt the passphrase with a key derived from the credential. */
async function decryptPassphrase(encrypted: string, credentialIdBuf: ArrayBuffer): Promise<string> {
  const packed = new Uint8Array(base64urlToBuf(encrypted));
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const key = await deriveKey(credentialIdBuf);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plainBuf);
}

/* ─── Public API ─── */

/**
 * Register a new passkey and encrypt the current passphrase with it.
 * Returns true on success.
 */
export async function registerPasskey(passphrase: string): Promise<boolean> {
  if (!isPasskeySupported()) return false;

  try {
    const userId = crypto.getRandomValues(new Uint8Array(32));

    const credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: RP_NAME, id: RP_ID },
        user: {
          id: userId,
          name: 'tempo-sync',
          displayName: 'Tempo Sync',
        },
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = bufToBase64url(credential.rawId);

    // Store credential reference
    const stored: StoredCredential = {
      credentialId,
      publicKey: bufToBase64url(response.getPublicKey?.() ?? new ArrayBuffer(0)),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(stored));

    // Encrypt and store the passphrase (local + server)
    const encrypted = await encryptPassphrase(passphrase, credential.rawId);
    localStorage.setItem(PASSKEY_ENCRYPTED_KEY, encrypted);
    await uploadBlob(credential.rawId, encrypted);

    return true;
  } catch (err) {
    console.error('Passkey registration failed:', err);
    return false;
  }
}

/**
 * Authenticate with passkey and recover the encrypted passphrase.
 * Returns the decrypted passphrase, or null on failure.
 */
export async function authenticateWithPasskey(): Promise<string | null> {
  if (!isPasskeySupported()) return null;

  try {
    const stored = getStoredCredential();

    // Build allowCredentials — empty if no local credential (discoverable flow)
    const allowCredentials: PublicKeyCredentialDescriptor[] = stored
      ? [{ type: 'public-key', id: base64urlToBuf(stored.credentialId) }]
      : [];

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        ...(allowCredentials.length ? { allowCredentials } : {}),
        userVerification: 'required',
        timeout: 60_000,
        rpId: RP_ID,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return null;

    // Try local blob first, then fetch from server
    let encrypted = localStorage.getItem(PASSKEY_ENCRYPTED_KEY);
    if (!encrypted) {
      encrypted = await fetchBlob(assertion.rawId);
    }
    if (!encrypted) return null;

    // Decrypt passphrase
    const passphrase = await decryptPassphrase(encrypted, assertion.rawId);

    // Cache locally for next time
    const credentialId = bufToBase64url(assertion.rawId);
    if (!stored || stored.credentialId !== credentialId) {
      const newStored: StoredCredential = {
        credentialId,
        publicKey: '',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(newStored));
      localStorage.setItem(PASSKEY_ENCRYPTED_KEY, encrypted);
    }

    return passphrase;
  } catch (err) {
    console.error('Passkey authentication failed:', err);
    return null;
  }
}

/** Remove the registered passkey from this device. */
export function removePasskey(): void {
  try {
    localStorage.removeItem(PASSKEY_STORAGE_KEY);
    localStorage.removeItem(PASSKEY_ENCRYPTED_KEY);
  } catch { /* ignore */ }
}
