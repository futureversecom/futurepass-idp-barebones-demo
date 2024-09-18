// dev env pre-registered client
// export const clientId = 'N8LvGuOdY5CeduNUGdUwB'; // This is a test Client ID, preferably use your own
// export const accessToken = '80rEBd2wrPkd4KZg33JQGFN0ILK-_bry5GWSjtadJJL'; // This is a test /manageclients Access Token, preferably use your own
// export const identityProviderUri = 'https://barca.passonline.dev'; // .dev -> DEV, .cloud -> STAGING, .app -> PRODUCTION
// export const custodialSignerUrl = `https://signer.futureverse.dev`;
// export const custodialSignerPassonlineUrl = `https://signer.passonline.dev`;

// dev neptune env pre-registered client
// export const clientId = 'ogtasiRiZfSkmbgo6ehf';
// export const accessToken = 'LyK-PkGiYX9DZcVFxJ6sOEpK5ZqECBkF5CpPa3Eag0n';
// export const identityProviderUri = 'https://barca.passonline.red';
// export const custodialSignerUrl = `https://signer.passonline.red`;
// export const custodialSignerPassonlineUrl = `https://signer.passonline.red`;

// staging env pre-registered client
// export const clientId = '8XPY4Vnc6BBn_4XNBYk0P';
// export const accessToken = 'G-Y5OwG_2NDRLFTpLpyjX92WyLMia2t0PcmPboGeMqi';
// export const identityProviderUri = 'https://login.futureverse.cloud';
// export const custodialSignerUrl = `https://signer.futureverse.cloud`;
// export const custodialSignerPassonlineUrl = `https://signer.passonline.cloud`;

// local
export const clientId = 'a0ebTPCOZ77kmuEqDUt2_';
export const accessToken = 'e_m24hyM_I6JYgqnlXZQS3M3hdG3x3GuitYv6JWOcvF';
export const identityProviderUri = 'http://localhost:4200';
export const custodialSignerUrl = `https://signer.futureverse.dev`;
export const custodialSignerPassonlineUrl = `https://signer.futureverse.dev`;

export const redirectUri = 'http://localhost:3000/callback'; // Ensure this matches the redirect_uri defined on /manageclients

export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;

export const alchemyJsonRpcProviderUrl = `https://rpc.sepolia.org/`; // add your onw alchemy json rpc provider url

// Used for test transaction
export const transaction_to_address =
  '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874'; // make sure you have enough balance in this wallet
export const transaction_chain_id = '11155111';

// Used for mixpanel tracking
export const mixpanelProjectToken = '';
