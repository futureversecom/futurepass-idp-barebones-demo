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
