const CRYPTO_PASSWORD = "gigahrush_save";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptSaveData(raw: string): Promise<string> {
  const data = encoder.encode(raw);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CRYPTO_PASSWORD),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const packed = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(encryptedArray, salt.length + iv.length);

  let binary = "";
  for (let i = 0; i < packed.length; i++) {
    binary += String.fromCharCode(packed[i]!);
  }
  return "ENC:" + btoa(binary);
}

export async function decryptSaveData(encryptedString: string): Promise<string> {
  if (!encryptedString.startsWith("ENC:")) {
    return encryptedString; // Legacy unencrypted save data
  }

  const base64 = encryptedString.substring(4);
  const binary = atob(base64);
  const packed = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    packed[i] = binary.charCodeAt(i);
  }

  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const encryptedData = packed.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CRYPTO_PASSWORD),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );

  return decoder.decode(decryptedBuffer);
}
