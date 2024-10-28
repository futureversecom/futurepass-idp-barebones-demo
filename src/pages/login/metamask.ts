import { SiweMessage } from "siwe";
import {
  authorizationEndpoint,
  clientId,
  identityProviderUri,
  redirectUri,
} from "../../config";
import {
  generateCodeVerifierAndChallenge,
  generateRandomString,
} from "../../helpers";
import { BrowserProvider, getAddress } from "ethers";

document
  .getElementById("login-button-metamask")!
  .addEventListener("click", loginWithMetamask);

async function loginWithMetamask() {
  console.log("login with metamask func");
  const thisWindow = window as any;
  if (!thisWindow.ethereum) {
    alert("Metamask not installed");
    return;
  }

  try {
    const provider = new BrowserProvider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);

    const account = getAddress(accounts[0]);

    const msg = new SiweMessage({
      version: "1",
      issuedAt: new Date().toISOString(),
      address: account,
      uri: identityProviderUri,
      domain: typeof window === "undefined" ? "" : window.location.host,
      chainId: 7672, // 7672 is for dev/staging, 7668 is for production
    });

    const signer = await provider.getSigner();

    const signature = await signer.signMessage(msg.prepareMessage());

    const siweParams = new URLSearchParams({
      nonce: msg.nonce,
      address: msg.address,
      issuedAt: msg.issuedAt!,
      domain: msg.domain,
      signature: signature,
    });
    const login_hint = "eoa:" + siweParams.toString();

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
      response_mode: "web_message",
      prompt: "login", // Use `none` to attempt silent authentication without prompting the user
      state,
      nonce,
      login_hint,
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `${authorizationEndpoint}?${queryString}`;

    window.location.href = url;
  } catch (error) {
    if ((error as any).code === 4001) {
      // User rejected the request
      console.error("User rejected the request");
    } else {
      console.error(
        "Error connecting to MetaMask or requesting signature:",
        error
      );
    }
    return null;
  }
}

//loginWithMetamask()