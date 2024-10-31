# Browser Pages Documentation

This document provides an overview of the pages located in the `src/browser` directory. Each page is responsible for handling specific functionalities related to the browser-based interactions of the application.

## Login Page

**File:** [src/browser/login/index.html](../src/browser/login/index.html)

The login page provides various options for users to authenticate using different identity providers. It includes buttons for logging in with Google, Facebook, Apple, Discord, Roblox, Email, and MetaMask.

**Related Scripts:**
- [src/browser/login/index.ts](../src/browser/login/index.ts): Main entry point for the login page.
- [src/browser/login/login.view.ts](../src/browser/login/login.view.ts): Handles the UI interactions for the login page.
- [src/browser/login/metamask.ts](../src/browser/login/metamask.ts): Handles MetaMask login functionality.

## Callback Page

**File:** [src/browser/callback/callback.html](../src/browser/callback/callback.html)

The callback page handles the response from the identity provider after the user has authenticated. It processes the authorization code, exchanges it for tokens, displays the token information, and provide options for signing message and transactions.

**Related Scripts:**
- [src/browser/callback/callback.view.ts](../src/browser/callback/callback.view.ts): Main script for handling the callback logic and displaying token information.

## Signature Callback Page

**File:** [src/browser/signature-callback/signature-callback.html](../src/browser/signature-callback/signature-callback.html)

The signature callback page is used by native clients (e.g., games) to handle the response from the custodial signer service. It processes the signed transaction or message and displays the result.

**Related Scripts:**
- [src/browser/signature-callback/signature-callback.view.ts](../src/browser/signature-callback/signature-callback.view.ts): Main script for handling the signature callback logic and displaying the signed data.


## Running locally

To start the browser demo, run the following command:

```sh
npm run dev:browser
```