Sure! Here's the guide in Markdown format:

# FuturePass Identity Provider Interaction Guide

This guide explains how to use the FuturePass Identity Provider (IDP) to authenticate users in your applications. It covers setting up a client, configuring authentication requests, handling responses, and decoding tokens.

## Table of Contents

1. [Overview](#overview)
2. [Setting Up a Client](#setting-up-a-client)
3. [Initiating Authentication](#initiating-authentication)
4. [Handling the Callback](#handling-the-callback)
5. [Decoding Tokens](#decoding-tokens)
6. [Security Best Practices](#security-best-practices)
7. [Example Code](#example-code)

## Overview

The FuturePass IDP supports OpenID Connect (OIDC), an identity layer on top of OAuth 2.0, which allows clients to verify the identity of the end-user. This guide will help you understand how to integrate with the FuturePass IDP.

## Setting Up a Client

1. **Register a Client:**

   - Visit the FuturePass management portal and register your application.
   - Obtain your `client_id` and configure your `redirect_uri`.

2. **Configure Redirect URI:**
   - Ensure your redirect URI is set correctly in the management portal. This is the URI to which the IDP will send users after they authenticate.

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

| Parameter               | Description                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `response_type`         | Specifies the type of response. For authorization code flow, use `code`.                               |
| `client_id`             | The client ID you obtained during client registration.                                                 |
| `redirect_uri`          | The URI to which the response will be sent. It must match the redirect URI registered with the client. |
| `scope`                 | A space-separated list of scopes. For OpenID Connect, include `openid`.                                |
| `code_challenge`        | The PKCE code challenge.                                                                               |
| `code_challenge_method` | The method used to generate the code challenge. Typically `S256`.                                      |
| `state`                 | A random string to maintain state between the request and callback. Helps prevent CSRF attacks.        |
| `nonce`                 | A random string to associate with the ID token. Helps prevent replay attacks.                          |
| `response_mode`         | Specifies how the result should be returned. For this example, use `query`.                            |
| `prompt`                | Specifies whether the user should be prompted for reauthentication.                                    |
| `login_hint`            | Hint about the login identifier the user might use.                                                    |

### Example Authorization Request URL

```plaintext
https://login.futureverse.dev/auth?
response_type=code&
client_id=YOUR_CLIENT_ID&
redirect_uri=http://localhost:3000/callback&
scope=openid profile email&
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

### Example JWT Decoding:

```js
function parseJwt(token) {
  const [header, payload, signature] = token.split('.')
  const decodedHeader = JSON.parse(atob(header))
  const decodedPayload = JSON.parse(atob(payload))
  return { header: decodedHeader, payload: decodedPayload, signature }
}

const decodedIdToken = parseJwt(idToken)
```

### Decoded ID Token Fields

| Field       | Description                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `iss`       | Issuer identifier for the issuer of the response.                                                 |
| `sub`       | Subject identifier. A unique identifier for the user.                                             |
| `aud`       | Audience(s) that this ID token is intended for.                                                   |
| `exp`       | Expiration time on or after which the ID token must not be accepted.                              |
| `iat`       | Time at which the JWT was issued.                                                                 |
| `auth_time` | Time when the user authentication occurred.                                                       |
| `nonce`     | String value used to associate a client session with an ID token, and to mitigate replay attacks. |
| `name`      | User's full name.                                                                                 |
| `email`     | User's email address.                                                                             |

### Example Decoded ID Token

```json
{
  "iss": "https://login.futureverse.dev",
  "sub": "1234567890",
  "aud": "YOUR_CLIENT_ID",
  "exp": 1609459200,
  "iat": 1609455600,
  "auth_time": 1609455600,
  "nonce": "NONCE",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

## Security Best Practices

1. **Use PKCE:**
   Ensure you use Proof Key for Code Exchange (PKCE) for securing your authorization code flow.

2. **Validate State and Nonce:**
   Always validate the state and nonce to prevent CSRF and replay attacks.

3. **Store Tokens Securely:**
   Store tokens securely in your application, preferably in secure HTTP-only cookies.

## Example Code

Below is a complete example demonstrating the steps discussed:

```js
const clientId = 'YOUR_CLIENT_ID'
const redirectUri = 'http://localhost:3000/callback'
const identityProviderUri = 'https://login.futureverse.dev'
const authorizationEndpoint = `${identityProviderUri}/auth`
const tokenEndpoint = `${identityProviderUri}/token`

async function login() {
  const { codeVerifier, codeChallenge } =
    await generateCodeVerifierAndChallenge()
  localStorage.setItem('code_verifier', codeVerifier)

  const state = generateRandomString(16)
  localStorage.setItem('state', state)

  const nonce = generateRandomString(16)
  localStorage.setItem('nonce', nonce)

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
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (state !== localStorage.getItem('state')) {
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const tokenResponse = await response.json()
  const decodedIdToken = parseJwt(tokenResponse.id_token)

  if (decodedIdToken.payload.nonce !== localStorage.getItem('nonce')) {
    throw new Error('Invalid nonce')
  }

  document.getElementById('token-response').innerText = JSON.stringify(
    tokenResponse,
    null,
    2
  )
  document.getElementById('id-token-decoded').innerText = JSON.stringify(
    decodedIdToken,
    null,
    2
  )
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function parseJwt(token) {
  const [header, payload, signature] = token.split('.')
  const decodedHeader = JSON.parse(atob(header))
  const decodedPayload = JSON.parse(atob(payload))
  return { header: decodedHeader, payload: decodedPayload, signature }
}

if (window.location.pathname === '/callback') {
  handleCallback()
}

document.getElementById('login-button').addEventListener('click', login)
```

This example demonstrates how to initiate the authentication process, handle the callback, and decode the ID token using the FuturePass IDP. Adjust the client ID, redirect URI, and identity provider URI as necessary.
