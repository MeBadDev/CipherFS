
export async function generateSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt);
}

export async function deriveKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const salt = base64ToArrayBuffer(saltBase64);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(
  data: BufferSource,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  return {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

export async function decryptData(
  ivBase64: string,
  ciphertextBase64: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = base64ToArrayBuffer(ivBase64);
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );
}

// Helpers
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function encryptGroupItems(
  items: any[],
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  const jsonString = JSON.stringify(items);
  const encodedData = new TextEncoder().encode(jsonString);
  return encryptData(encodedData, key);
}

export async function decryptGroupItems(
  iv: string,
  ciphertext: string,
  key: CryptoKey
): Promise<any[]> {
  const decryptedBuffer = await decryptData(iv, ciphertext, key);
  const decryptedText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedText);
}

export async function tryDecryptGroup(
  passphrase: string,
  salt: string,
  iv: string,
  ciphertext: string
): Promise<{ success: boolean; key?: CryptoKey; items?: any[] }> {
  try {
    const key = await deriveKey(passphrase, salt);
    const items = await decryptGroupItems(iv, ciphertext, key);
    return { success: true, key, items };
  } catch (error) {
    return { success: false };
  }
}
