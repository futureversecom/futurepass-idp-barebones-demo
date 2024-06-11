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

export function parseJwt(token: string) {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload) {
    throw new Error("Invalid JWT token");
  }

  const decodedHeader = JSON.parse(base64UrlDecode(header));
  const decodedPayload = JSON.parse(base64UrlDecode(payload));

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature,
  };
}

export function base64UrlDecode(str: string) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = str + padding;
  return atob(base64);
}
