import { clientId, redirectUri, tokenEndpoint } from "../../config";
import { parseJwt } from "./helpers";

displayAuthorizationCode();
handleCallback();

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) {
    throw new Error("Missing code or state in the callback");
  }

  verifyState(state);

  const codeVerifier = localStorage.getItem("code_verifier");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code!,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier!,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const tokenEndpointResponse = await response.json();
  const decodedIdToken = parseJwt(tokenEndpointResponse.id_token);

  if (!decodedIdToken) {
    throw new Error("Invalid JWT token");
  }

  verifyNonce(decodedIdToken.payload.nonce);

  displayTokenResponse(tokenEndpointResponse);
  displayDecodedIdToken(decodedIdToken);
}

function verifyState(state: string) {
  const savedState = localStorage.getItem("state");
  if (state !== savedState) {
    throw new Error("Invalid state (CSRF protection)");
  }
}

function verifyNonce(nonce: string) {
  const savedNonce = localStorage.getItem("nonce");
  if (nonce !== savedNonce) {
    throw new Error("Invalid nonce (replay protection)");
  }
}

function displayAuthorizationCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    document.getElementById("authorization-code")!.innerHTML = code;
  }
}

function displayTokenResponse(response: any) {
  document.getElementById("token-response")!.innerText = JSON.stringify(
    response,
    null,
    2
  );
}

function displayDecodedIdToken(decodedToken: any) {
  document.getElementById("id-token-decoded")!.innerText = JSON.stringify(
    decodedToken,
    null,
    2
  );
}
