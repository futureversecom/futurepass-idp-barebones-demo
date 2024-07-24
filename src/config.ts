export const clientId = 'N8LvGuOdY5CeduNUGdUwB'; // This is a test Client ID, preferably use your own
// export const clientId = 'A2bIhyIQq4E9t-X-PPhg5';

export const accessToken = '80rEBd2wrPkd4KZg33JQGFN0ILK-_bry5GWSjtadJJL'; // This is a test /manageclients Access Token, preferably use your own
// export const accessToken = 'cR_1ve5oZ9E7YEIsc5186PqJSz86cogRol2PagKj2U9';

export const redirectUri = 'http://localhost:3000/callback'; // Ensure this matches the redirect_uri defined on /manageclients

export const identityProviderUri = 'https://login.futureverse.dev'; // .dev -> DEV, .cloud -> STAGING, .app -> PRODUCTION
// export const identityProviderUri = 'https://login.futureverse.red';

export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;
export const wellknownEndpoint = `${identityProviderUri}/.well-known/openid-configuration`;

export const custodialSignerUrl = `https://signer.futureverse.dev`;

export const alchemyJsonRpcProviderUrl = ``; // add your onw alchemy json rpc provider url

// Used for test transaction
export const transaction_to_address = ''; // make sure you have enough balance in this wallet
export const transaction_chain_id = '11155111';
