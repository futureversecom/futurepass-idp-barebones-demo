export const clientId = '1QqqX2Q3MbNFFudntCJvr'; // This is a test Client ID, preferably use your own
export const accessToken = '80rEBd2wrPkd4KZg33JQGFN0ILK-_bry5GWSjtadJJL'; // This is a test /manageclients Access Token, preferably use your own
export const redirectUri = 'http://localhost:3000/callback'; // Ensure this matches the redirect_uri defined on /manageclients

export const identityProviderUri = 'http://localhost:4200'; // .dev -> DEV, .cloud -> STAGING, .app -> PRODUCTION

export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;

export const custodialSignerUrl = `http://localhost:4202`;

export const alchemyJsonRpcProviderUrl = `https://eth-sepolia.g.alchemy.com/v2/demo`; // add your onw alchemy json rpc provider url

// Used for test transaction
export const transaction_to_address =
  '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874'; // make sure you have enough balance in this wallet
export const transaction_chain_id = '11155111';
