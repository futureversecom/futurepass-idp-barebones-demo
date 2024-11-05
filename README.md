# FuturePass Identity Provider Interaction Guide

This guide explains how to use the FuturePass Identity Provider (IDP) to authenticate users in your applications using the API directly without any of the Futureverse SDKs. It covers registering your experience, configuring authentication requests, handling responses, and decoding tokens.

This guide only covers custodial accounts, if non-custodial is requirement we can add that.

Refer [Server](./docs/server.md) and [Browser](./docs/browser.md) documentation to understand API requests and web pages interacting with Blockchain and Identity provider.

**Note:** This demo's goal is simplicity so do not depend on the helper functions used in the code to generate random strings, generate sha256, decode JWT and so on. These are not officially provided by Futureverse and here only for explanation purposes. You should use libraries which securely process data or extensively test your own implementation for edge cases. Also server example is only for demo purpose, it is not expected to be used in production environment.

## Table of Contents

1. [Overview](#overview)
2. [Registering Your Experience](#registering-your-experience)
3. [Initiating Authentication](#initiating-authentication)
4. [Handling the Callback](#handling-the-callback)
5. [Decoding Tokens](#decoding-tokens)
6. [Transaction Process for Custodial Accounts](#transaction-process-for-custodial-accounts)
7. [Silent Login](#silent-login)
8. [Logout](#logout)
9. [Security Best Practices](#security-best-practices)
10. [Example Code](#example-code)
11. [Running locally](#running-locally)

## Overview

Before using `FutureverseProvider` container you will need to register an OAuth2 client with the Futureverse Identity Provider using the Manage Clients Console:

- **Production:** https://login.pass.online/manageclients
- **Development / Staging:** https://login.passonline.cloud/manageclients
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

   Include optional parameters such as `web3_connector_id`

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
  web3_connector_id: 'metamask',
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
| `web3_connector_id`     | An optional parameter used to track which web3 wallect is used to login                                |

#### Variable Parameter - `login_hint`

The `login_hint` parameter can take various values depending on the requested login type

| `login_hint` value   | Login type                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `email:`             | Email login                                                                                              |
| `social:google`      | Google login                                                                                             |
| `social:facebook:`   | Facebook login                                                                                           |
| `eoa:<siwe-message>` | MetaMask login                                                                                           |
| `game:unreal:`       | IDP-F login (Games), the `login_hint` indicate that the user login from the game using the unreal engine |
| `game:unity:`        | IDP-F login (Games), the `login_hint` indicate that the user login from the game using the unity engine  |
| undefined            | IDP-F login (Games), no `login_hint` is passed, the game engine is not tracked                           |

### Example Authorization Request URL

```plaintext
https://login.passonline.dev/auth?
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

## Transaction Process for Custodial Accounts

Custodial account transactions are unique as these users cannot sign transactions using their web3 wallets. To ensure security and align with the characteristics of web3 transactions, we have developed a special application called the **Custodial Signer**. This application securely handles the transaction signing process by communicating with a server specifically designed to manage custodial account transactions.

### Integration Guide

To use custodial accounts to complete transactions, tt requires users to implement a popup window and communicate with the custodial signer via post messages to obtain the signature. Then, the obtained signature is used to send the transaction to the blockchain.

### Code Example: Barebones Solution

#### Step 1: Get Signature by Communicating with Custodial Signer

```javascript
import { ethers } from 'ethers'

const rawTransactionWithoutSignature = {
  to: 'the destination wallet address',
  value: ethers.parseEther('0.01'),
  chainId: 'the chain id',
  gasLimit: 210000,
  gasPrice: ethers.parseUnits('10.0', 'gwei'),
}
let nonce = 0

const custodialSignerUrl = 'the custodial signer service url'

async function signTransaction() {
  if (typeof window === 'undefined') {
    return
  }

  const fromAccount = 'your own wallet address'

  const transactionCount = await provider.getTransactionCount(fromAccount)
  nonce = transactionCount + 1

  const serializedUnsignedTransaction = ethers.Transaction.from({
    ...rawTransactionWithoutSignature,
    nonce,
  }).unsignedSerialized

  const signTransactionPayload = {
    account: fromAccount,
    transaction: serializedUnsignedTransaction,
  }

  // If using native clients (games) payload can include callbackUrl to which signature will be sent
  // const signTransactionPayload = {
  //   account: fromAccount,
  //   transaction: serializedUnsignedTransaction,
  //   callbackUrl: 'http://localhost:3000/signature-callback' // <- your game callback URL here
  // };

  const id = 'client:2' // must be formatted as `client:${ an identifier number }`
  const tag = 'fv/sign-tx' // do not change this

  const encodedPayload = {
    id,
    tag,
    payload: signTransactionPayload,
  }

  window.open(
    `${custodialSignerUrl}?request=${base64UrlEncode(
      JSON.stringify(encodedPayload),
    )}`,
    'futureverse_wallet', // don't change this
    'popup,right=0,width=290,height=286,menubar=no,toolbar=no,location=no,status=0',
  )

  window.addEventListener('message', (ev) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = signMessageType.decode(ev.data)

      if (E.isRight(dataR)) {
        transactionSignature = dataR.right.payload.response.signature
      }
    }
  })
}
```
Refer: [getSignatureFromCustodialSigner](./src/shared/helpers.ts) to get signature on web and native(server) clients.

#### Step 2: Send Transaction to Blockchain

```javascript
sync function sendTransaction() {
  if (transactionSignature == null || fromAccount == null) {
    return;
  }

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    signature: transactionSignature,
    from: fromAccount,
    nonce,
  };

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature
  ).serialized;

  const transactionResponse = await provider.broadcastTransaction(
    serializedSignedTransaction
  );
}
```
Refer: [signEthTransaction](./src/shared/transaction.ts), [signRootTransaction](./src/shared/transaction.ts) and [sendTransaction](./src/shared/transaction.ts)

## Silent Login

### Introduction

Silent login is a method used to obtain a new authentication token without disturbing the user, typically when the user is already logged in and has an active session. It is particularly useful in Single Sign-On (SSO) scenarios and applications that need to maintain the user's logged-in state.

### Use Cases

1. **Cross-Application Single Sign-On (SSO)**:

   - When multiple applications share the same identity provider, silent login can maintain the login state as the user switches between applications without requiring each application to individually use a refresh token.

2. **Session Restoration**:

   - After the user closes the browser or tab, silent login can check and restore the user session when the application is reopened, eliminating the need for the user to manually log in again.

3. **Token Refresh**:
   - When the user's access token expires but there is still an active session, silent login can transparently obtain a new access token without requiring the user to re-authenticate.

### Advantages

- **No User Interaction**: Silent login operates without requiring any user interaction when there is an active session.
- **Cross-Domain or Cross-Application Support**: Ideal for SSO scenarios, maintaining a consistent login state across different applications.
- **Session Maintenance**: Automatically checks and restores the user session when the browser or tab is reopened.

### Limitations

- **Dependent on Browser Session State**: Silent login relies on the browser's session state (e.g., cookies). If the session expires or is deleted, silent login will not function.

### Example Silent Login Request URL

```plaintext
https://login.passonline.dev/auth?
response_type=code&
client_id=YOUR_CLIENT_ID&
redirect_uri=http://localhost:3000/callback&
scope=openid&
code_challenge=CODE_CHALLENGE&
code_challenge_method=S256&
state=STATE&
nonce=NONCE&
response_mode=query&
prompt=none&
login_hint=<the target eoa usually coming from current login>
```

## Logout

To log a user out of your application, you need to clear their session data and redirect them to the FuturePass logout endpoint.

```js
function logout() {
  localStorage.clear()
  window.location.href = `${identityProviderUri}/logout`
}
```

### Importance of Logging Out Before Initiating a New Login

It is crucial to log out before initiating a new login. If this step is skipped, a Dropped Pass error will occur. This happens because, the demo does not check for existing session or tries `silent_login` (which is something we recommend every experience to do).

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

1. Email, Google, Facebook, and IDP-F login example can be found at [`./src/browser/login/login.view.ts`](./src/browser/login/login.view.ts).
2. MetaMask login example can be found at [`./src/browser/login/metamask.ts`](./src/browser/login/metamask.ts).
3. Handling callback and decoding the ID token can be found at [`./src/browser/callback/callback.view.ts`](./src/browser/callback/callback.view.ts)
4. Handling signature callbacks for native clients(games) can be found at ['./src/browser/signature-callback/signature-callback.view.ts'](./src/browser/signature-callback/signature-callback.view.ts)

## Running locally
- Run server demo locally using `npm run dev:server`
- Run browser demo locally using `npm run dev:browser` 