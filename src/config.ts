export const clientId = 'ougWgKauUUTnqreUVIuSB'; // This is a test Client ID, preferably use your own
export const accessToken = 'OfsSfR43sTsuJoUcfP3upudjmBuMZmbcMS6iDdTdTkO'; // This is a test /manageclients Access Token, preferably use your own
export const redirectUri = 'http://localhost:3000/callback'; // Ensure this matches the redirect_uri defined on /manageclients

export const identityProviderUri = 'https://login.passonline.red'; // .dev -> DEV, .cloud -> STAGING, .app -> PRODUCTION

export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;

export const custodialSignerUrl = `http://127.0.0.1:4202`;

export const alchemyJsonRpcProviderUrl = `https://rpc.sepolia.org/`; // add your onw alchemy json rpc provider url

// Used for test transaction
export const transaction_to_address =
  '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874'; // make sure you have enough balance in this wallet
export const transaction_chain_id = '11155111';
