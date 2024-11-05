# Server API Documentation

This document provides an overview of the server routes, their functionality, query parameters, and responses in the server located in the `src/server` directory that interacts with identity provider and blockchain, you can refer these routes to build your own server hosted in cloud or running in your native game client.

## Routes

### `/login`

**Method:** `GET`

**Description:**  
Initiates the login using IDP. It will open a new window to login using IDP and will redirect to `/callback` page when login is successful. 
This route is managed by the [handleLogin](../src//server/api/login.route.ts) function.

**Query Parameters:**  
None

**Response:**
- **200 OK:** Successful login.
- **500 Internal Server Error:** If an error occurs during login.

### `/callback`

**Method:** `GET`

**Description:**  
Handles the callback process after authentication. This route is managed by the [handleCallback](../src/server/api/callback.route.ts) function and will automatically be called by IDP on successful login. It processes the callback data and generates demo URLs for signing transactions and messages.

**Query Parameters:**  
- `code` (string): The authorization code received from the authentication provider.
- `state` (string): state passsed to IDP before login.

**Response:**
- **200 OK:** Callback processed successfully.
- **400 Bad Request:** If the `code` parameter is missing or invalid.
- **500 Internal Server Error:** If an error occurs during callback processing.

### `/sign-msg`

**Method:** `GET`

**Description:**  
Handles the signing of messages. This route is managed by the [handleSignMsg](../src/server/api/sign-msg.route.ts) function. This route will open the Custodial Signer window and get the signature from it using callbackUrl parameter. It will create a new server and listen for the signature from Custodial Signer.

**Query Parameters:**  
- `message` (hex string): The message to be signed.

**Response:**

- **200 OK:**

  ```
    {
      message: 'Transaction signed',
      data: {
        from: <eoa>,
        message: <string>
        signature: <hex string>,
      },
    }
  ```

- **400 Bad Request:** If the `message` parameter is missing or invalid.
- **401 Bad Request:** If user is not logged in.
- **500 Internal Server Error:** If an error occurs during message signing.
  
  ```
    {
      message: 'Failed to sign message',
      data: {
        from: <eoa>,
        message: <string>
        error: <error-code>,
      }
    }
  ```


### `/sign-tx`

**Method:** `GET`

**Description:**  
Handles the signing of transactions. This route is managed by the [handleSignTx](../src/server/api/send-tx.route.ts) function.This route will open the Custodial Signer window and get the signature from it using callbackUrl parameter. It will create a new server and listen for the signature from Custodial Signer.

**Query Parameters:**  

- `to` (hex address, eoa/futurepass): receiver address.
- `chainId` (number): eth/root chain id.
- `amount` (number): amount to be sent.

**Response:**

- **200 OK:**
  
  ```
  {
    message: 'Transaction signed',
    data: {
      from: <sender-address>,
      to: <receiver-address>,
      chainId: <chain-id>,
      serializedSignedTransaction: <serialized-signed-transaction>,
      sendTransactionUrl: <demo-send-transaction-url>
    },
  }

  ```

- **400 Bad Request:** If the `tx` parameter is missing or invalid.
- **500 Internal Server Error:** If an error occurs during transaction signing.
  ```
  {
    message: 'Failed to sign transaction',
    data: {
      to: <receiver-address>,
      chainId: <chain-id>,
      error: <error-code>,
    }
  }
    
  ```


### `/send-tx`

**Method:** `GET`

**Description:**  
Handles the sending of transactions. This route is managed by the [handleSendTx](../src/server/api/send-tx.route.ts) function.

**Query Parameters:**  
- `serializedSignedTransaction` (hex string): Signed and serialized transaction in hex.

**Response:**
- **200 OK:**
  ```
  {
    message: 'Transaction sent',
    data: {
      serializedSignedTransaction: <signed-transaction>,
      txResponse: <transaction-receipt>,
    },
  }
  ```
- **400 Bad Request:** If the `tx` parameter is missing or invalid.
- **500 Internal Server Error:** If an error occurs during transaction sending.

## Running locally

To start the server, run the following command:

```sh
npm run dev:server
```