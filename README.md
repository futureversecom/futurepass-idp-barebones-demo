# FuturePass Identity Provider Interaction Guide

This guide explains how to use the FuturePass Identity Provider (IDP) to authenticate users in your applications using the API directly without any of the Futureverse SDKs. It covers registering your experience, configuring authentication requests, handling responses, and decoding tokens.

This guide only covers custodial accounts, if non-custodial is requirement we can add that.

**Note:** This demo's goal is simplicity so do not depend on the helper functions used in the code to generate random strings, generate sha256, decode JWT and so on. These are not officially provided by Futureverse and here only for explanation purposes. You should use libraries which securely process data or extensively test your own implementation for edge cases.

## Table of Contents

1. [Overview](#overview)
2. [Registering Your Experience](#registering-your-experience)
3. [Initiating Authentication](#initiating-authentication)
4. [Handling the Callback](#handling-the-callback)
5. [Decoding Tokens](#decoding-tokens)
6. [Security Best Practices](#security-best-practices)
7. [Example Code](#example-code)

## Overview

Before using `FutureverseProvider` container you will need to register an OAuth2 client with the Futureverse Identity Provider using the Manage Clients Console:

- **Production:** https://login.futureverse.app/manageclients
- **Development / Staging:** https://login.futureverse.cloud/manageclients
- **Audit (Canary):** https://login.futureverse.kiwi/manageclients

You will need to provide two arguments:

- **Client Name:** the name of your application (e.g. `futureverse-experience-demo`). Don’t use any characters other than alphanumeric, `-` and `_`. This does not have to be unique, you can register again with the same name and you will receive a fresh set of credentials.
- **Redirect URLs:** The URL in your application to redirect to after a successful login. Please make sure to include protocol in the URL (`http` for development, `https` for production). You can provide multiple URLs by separating them with a comma. This may be useful if e.g. you’d like to register [localhost](http://localhost) for local development and a deployed URL for your staging environment. For example: `[http://localhost:3000/](http://localhost:3000/login)home,https://*-demo[.preview.com](http://futureverse.vercel.com/)/home,[https://futureverse-experience-demo.staging.com/home](https://identity-dashboard.futureverse.cloud/)` would register localhost for local development, a wildcarded preview URL for dynamic deployments and a staging URL.

**Note:** wildcards in Redirect URLs are only available when registering using the **Development** portal listed above. When registering your app for production you need to provide full Redirect URLs.

Upon successful registration, you’ll be presented with a Client ID, Name and an Access Token. Make sure to save these. You will need the Client ID and the Redirect URL in your application to configure the `FutureverseProvider`. Treat them as any other secrets in your application (so don’t commit them with your code!).

Experience Name and Access Token are used to view and edit this registration, they’re not required in the codebase.

## Initiating Authentication

To initiate the authentication process, your application needs to redirect the user to the FuturePass authorization endpoint.

### Steps:

1. **Generate Code Verifier and Challenge:**
   Use PKCE (Proof Key for Code Exchange) to enhance security.

2. **Generate State and Nonce:**
   These are used to prevent CSRF attacks and replay attacks, respectively.

3. **Build Authorization URL:**
   Include required parameters such as `response_type`, `client_id`, `redirect_uri`, `scope`, `code_challenge`, `code_challenge_method`, `state`, and `nonce`.

### Example Authorization URL:

```js
const params = {
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: 'openid profile email',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  state: state,
  nonce: nonce,
}

const queryString = new URLSearchParams(params).toString()
const url = `${authorizationEndpoint}?${queryString}`
window.location.href = url
```

### Authorization Request Parameters
#### Common Parameters:

| Parameter               | Description                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `response_type`         | Specifies the type of response. For authorization code flow, use `code`.                               |
| `client_id`             | The client ID you obtained during client registration.                                                 |
| `redirect_uri`          | The URI to which the response will be sent. It must match the redirect URI registered with the client. |
| `scope`                 | A space-separated list of scopes. Use `openid`.                                                        |
| `code_challenge`        | The PKCE code challenge.                                                                               |
| `code_challenge_method` | The method used to generate the code challenge. Use `S256`.                                            |
| `state`                 | A random string to maintain state between the request and callback. Helps prevent CSRF attacks.        |
| `nonce`                 | A random string to associate with the ID token. Helps prevent replay attacks.                          |
| `response_mode`         | Specifies how the result should be returned. For this example, use `query`.                            |
| `prompt`                | Specifies whether the user should be prompted for reauthentication.                                    |

#### Variable Parameter - `login_hint`

The `login_hint` parameter can take various values depending on the requested login type 

| `login_hint` value   | Login type                                    |
| -------------------- | ---------------------------------------------- |
| `email:`             | Email login                                    |
| `social:google`      | Google login                                   |
| `social:facebook:`   | Facebook login                                 |
| `eoa:<siwe-message>` | MetaMask login                                 |
| undefined            | IDP-F login (Games), no `login_hint` is passed |


### Example Authorization Request URL

```plaintext
https://login.futureverse.dev/auth?
response_type=code&
client_id=YOUR_CLIENT_ID&
redirect_uri=http://localhost:3000/callback&
scope=openid&
code_challenge=CODE_CHALLENGE&
code_challenge_method=S256&
state=STATE&
nonce=NONCE&
response_mode=query&
prompt=login&
login_hint=email:
```

## Handling the Callback

After the user authenticates, they are redirected back to your application with an authorization code.

### Steps:

1. **Retrieve Authorization Code and State:**
   Extract these from the query parameters.

2. **Verify State:**
   Ensure the state matches the one you generated earlier.

3. **Exchange Authorization Code for Tokens:**
   Send a POST request to the token endpoint to exchange the authorization code for ID, access, and refresh tokens.

### Example Callback Handling:

```js
const params = new URLSearchParams(window.location.search)
const code = params.get('code')
const state = params.get('state')

if (state !== savedState) {
  throw new Error('Invalid state')
}

const codeVerifier = localStorage.getItem('code_verifier')
const body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier,
})

const response = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: body.toString(),
})

const tokenResponse = await response.json()
localStorage.setItem('access_token', tokenResponse.access_token)
localStorage.setItem('refresh_token', tokenResponse.refresh_token)
localStorage.setItem('id_token', tokenResponse.id_token)
```

### Token Request Parameters

| Parameter       | Description                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `grant_type`    | The type of grant being requested. For authorization code flow, use `authorization_code`.              |
| `code`          | The authorization code received from the authorization endpoint.                                       |
| `redirect_uri`  | The URI to which the response will be sent. It must match the redirect URI registered with the client. |
| `client_id`     | The client ID you obtained during client registration.                                                 |
| `code_verifier` | The PKCE code verifier.                                                                                |

### Example Token Request Body

```plaintext
grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=http://localhost:3000/callback&
client_id=YOUR_CLIENT_ID&
code_verifier=CODE_VERIFIER
```

### Token Response Fields

| Field           | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `access_token`  | The token that can be used to access protected resources.    |
| `id_token`      | A JWT that contains user identity information.               |
| `refresh_token` | A token that can be used to obtain new access tokens.        |
| `token_type`    | The type of token issued. Typically `Bearer`.                |
| `expires_in`    | The duration in seconds for which the access token is valid. |

### Example Token Response

```json
{
  "access_token": "ACCESS_TOKEN",
  "id_token": "ID_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## Decoding Tokens

The ID token is a JWT (JSON Web Token) that contains user information. You need to decode this token to retrieve user details.

### Decoded ID Token Fields

| Login Type                      | Claim        | Description                                                                                                                                                               | Optional |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Custodial and non-Custodial     | `sub`        | A locally unique and never reassigned identifier within the Issuer for the End-User                                                                                       | No       |
| Custodial and non-Custodial     | `eoa`        | The externally owned account derived from public key                                                                                                                      | No       |
| Custodial and non-Custodial     | `futurepass` | The FuturePass account address associated with this account                                                                                                               | No       |
| Custodial and non-Custodial     | `chainId`    | The block chain id                                                                                                                                                        | No       |
| Custodial and non-Custodial     | `nonce`      | A string value used to associate a Client session with an ID Token, and to mitigate replay attacks                                                                        | No       |
| Custodial and non-Custodial     | `at_hash`    | A hash value verifies the integrity and authenticity of the access token                                                                                                  | No       |
| Custodial and non-Custodial     | `aud`        | Intended audience for the ID token                                                                                                                                        | No       |
| Custodial and non-Custodial     | `exp`        | The expiration time on or after which the ID token MUST NOT be accepted for processing                                                                                    | No       |
| Custodial and non-Custodial     | `iat`        | The time at which the ID token was issued                                                                                                                                 | No       |
| Custodial and non-Custodial     | `iss`        | The issuer of the response                                                                                                                                                | No       |
| Custodial                       | `auth_time`  | The time when the authentication occurred                                                                                                                                 | Yes      |
| Custodial and non-Custodial     | `custodian`  | self for non-custodial, fv for custodial                                                                                                                                  | No       |
| Custodial (Google and Facebook) | `email`      | When logged in with Google, this is the user's email address. The value of this claim may not be unique to the Google account used to log in, and could change over time. | Yes      |

## Security Best Practices

1. **Use PKCE:**
   Ensure you use Proof Key for Code Exchange (PKCE) for securing your authorization code flow.

2. **Validate State and Nonce:**
   Always validate the state and nonce to prevent CSRF and replay attacks.

3. **Store Tokens Securely:**
   Store tokens securely in your application, preferably in secure HTTP-only cookies.

4. **Use Tested Libraries:**
   Instead of using the helper functions from this code, use battle-tested libraries for handling PKCE, state, nonce, parsing JWT etc.

## Example Code
1. Email, Google, Facebook, and IDP-F login example can be found at [`./src/pages/login/login.ts`](./src/pages/login/login.ts).
2. MetaMask login example can be found at [`./src/pages/login/metamask.ts`](./src/pages/login/metamask.ts).
3. Handling callback and decoding the ID token can be found at [`./src/pages/callback/callback.ts`](./src/pages/callback/callback.ts)