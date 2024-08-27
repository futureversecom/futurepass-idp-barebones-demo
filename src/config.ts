export const clientId = 'dashboard'; // This is a test Client ID, preferably use your own
export const accessToken = 'G-Y5OwG_2NDRLFTpLpyjX92WyLMia2t0PcmPboGeMqi'; // This is a test /manageclients Access Token, preferably use your own
export const redirectUri = 'http://localhost:4204/callback'; // Ensure this matches the redirect_uri defined on /manageclients

export const identityProviderUri = 'http://localhost:4200'; // .dev -> DEV, .cloud -> STAGING, .app -> PRODUCTION

export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;

export const custodialSignerUrl = `http://localhost:4202`;

export const alchemyJsonRpcProviderUrl = `https://rpc.sepolia.org/`; // add your onw alchemy json rpc provider url

// Used for test transaction
export const transaction_to_address =
  '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874'; // make sure you have enough balance in this wallet
export const transaction_chain_id = '11155111';

// Used for mixpanel tracking
export const mixpanelProjectToken = 'dfb084e3ff87f5aed5d21cc88ec38a7e';
