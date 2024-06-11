import { authorizationEndpoint, clientId, redirectUri } from "../../config";
import {
  generateCodeVerifierAndChallenge,
  generateRandomString,
} from "./helpers";

document
  .getElementById("login-button-google")!
  .addEventListener("click", loginWithGoogle);

async function loginWithGoogle() {
  console.log("login with Google   called");
  const { codeVerifier, codeChallenge } =
    await generateCodeVerifierAndChallenge();
  localStorage.setItem("code_verifier", codeVerifier);

  const state = generateRandomString(16);
  localStorage.setItem("state", state);

  const nonce = generateRandomString(16);
  localStorage.setItem("nonce", nonce);

  const params = {
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    response_mode: "query",
    prompt: "login", // Use `none` to attempt silent authentication without prompting the user
    login_hint: "social:google",
    state,
    nonce,
  };

  const queryString = new URLSearchParams(params).toString();
  const url = `${authorizationEndpoint}?${queryString}`;

  window.location.href = url;
}
