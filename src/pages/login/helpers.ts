/* HELPERS */

export function generateRandomString(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateCodeVerifierAndChallenge() {
  const codeVerifier = generateRandomString(128);
  const buffer = new TextEncoder().encode(codeVerifier);
  const hashed = await sha256(buffer);
  const codeChallenge = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(hashed))
  );
  return { codeVerifier, codeChallenge };
}

export function sha256(buffer: ArrayBuffer) {
  return crypto.subtle.digest("SHA-256", buffer);
}

export function base64UrlEncode(str: string) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
