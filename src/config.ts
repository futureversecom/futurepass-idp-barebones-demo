export const clientId = 'XfBxqrFOJ6NXC9FqxIAL-' // This is a test Client ID, preferably use your own
export const accessToken = 'G-Y5OwG_2NDRLFTpLpyjX92WyLMia2t0PcmPboGeMqi' // This is a test /manageclients Access Token, preferably use your own
export const redirectUri = 'https://futurepass-idp-barebones-demo-git-pfs-604-ad-cb4e7a-futureverse.vercel.app/callback' // Ensure this matches the redirect_uri defined on /manageclients

export const identityProviderUri = 'login.passonline.dev' // login.passonline.dev -> DEV, login.passonline.cloud -> STAGING, login.pass.online -> PRODUCTION

export const authorizationEndpoint = `${identityProviderUri}/auth`
export const tokenEndpoint = `${identityProviderUri}/token`

export const custodialSignerUrl = `https://signer.passonline.cloud`

// export const jsonRpcProviderUrl = `https://rpc.sepolia.org/`; // Ethereum Sepolia
export const jsonRpcProviderUrl = `https://porcini.rootnet.app/archive` // TRN Porcini

// Used for test transaction
export const transactionToAddress = '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874' // make sure you have enough balance in this wallet
// export const chainId = "11155111"; // Ethereum Sepolia
export const chainId = '7672' // TRN Porcini

// Used for mixpanel tracking
export const mixpanelProjectToken = 'dfb084e3ff87f5aed5d21cc88ec38a7e'
