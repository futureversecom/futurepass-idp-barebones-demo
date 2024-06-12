export const clientId = "N8LvGuOdY5CeduNUGdUwB"; // This is a test Client ID, preferably use your own
export const accessToken = "80rEBd2wrPkd4KZg33JQGFN0ILK-_bry5GWSjtadJJL"; // This is a test /manageclients Access Token, preferably use your own
export const redirectUri = "http://localhost:3000/callback"; // Ensure this matches the redirect_uri defined on /manageclients
export const identityProviderUri = "https://login.futureverse.dev"; // .dev -> DEV, .cloud -> STAGING, .app -> PRODUCTION
export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;
  