import { authorizationEndpoint, clientId, redirectUri } from '../../config';
import {
  generateCodeVerifierAndChallenge,
  generateRandomString,
} from '../../helpers';

export async function login(
  loginType: 'google' | 'facebook' | 'email' | 'idp-f' | 'silent',
  targetEoa?: string
) {
  console.log(`login with ${loginType} called`);
  const { codeVerifier, codeChallenge } =
    await generateCodeVerifierAndChallenge();
  localStorage.setItem('code_verifier', codeVerifier);

  const state = generateRandomString(16);
  localStorage.setItem('state', state);

  const nonce = generateRandomString(16);
  localStorage.setItem('nonce', nonce);

  const commonParams = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_mode: 'web_message',
    prompt: 'login', // Use `none` to attempt silent authentication without prompting the user
    state,
    nonce,
  };

  let query;
  switch (loginType) {
    case 'email':
      query = { ...commonParams, login_hint: 'email:' };
      break;
    case 'facebook':
      query = { ...commonParams, login_hint: 'social:facebook' };
      break;
    case 'google':
      query = { ...commonParams, login_hint: 'social:google' };
      break;
    case 'silent':
      if (targetEoa) {
        query = { ...commonParams, prompt: 'none', login_hint: targetEoa };
        console.log(query);
        break;
      }
    case 'idp-f':
      // for idp-f we don't pass login_hint just commonParams
      query = commonParams;
  }

  const queryString = new URLSearchParams(query).toString();
  const url = `${authorizationEndpoint}?${queryString}`;

  window.location.href = url;
}
