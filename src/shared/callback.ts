import { clientId, tokenEndpoint } from './config'
import { parseJwt, redirectUri, localStorage } from './helpers'
import { demoMixpanel } from './mixpanel'

export async function processCallback(searchString: string) {
  const params = new URLSearchParams(searchString)
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')
  const errorDescription = params.get('error_description')
  if(error) {
    throw new Error(errorDescription || 'Error during authentication')
  }
  if (!code || !state) {
    throw new Error('Missing code or state in the callback')
  }
  verifyState(state)

  const codeVerifier = localStorage.getItem('code_verifier')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code!,
    redirect_uri: redirectUri,
    client_id: clientId,
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const tokenEndpointResponse = await response.json()
  if(tokenEndpointResponse.error) {
    return null
  }
  const decodedIdToken = parseJwt(tokenEndpointResponse.id_token)

  if (!decodedIdToken) {
    throw new Error('Invalid JWT token')
  }
  if(codeVerifier) {
    verifyNonce(decodedIdToken.payload.nonce)
  }

  const refreshToken = tokenEndpointResponse.refresh_token

  localStorage.setItem('refresh_token', refreshToken)
  localStorage.setItem('id_token', tokenEndpointResponse.id_token)
  localStorage.setItem('token_endpoint_response', tokenEndpointResponse)
  localStorage.setItem('decoded_id_token', JSON.stringify(decodedIdToken))
  localStorage.setItem('code', code)

  trackEvent()

  return {
    tokenEndpointResponse,
    decodedIdToken,
    refreshToken,
    code,
  }
}

function verifyState(state: string) {
  const savedState = localStorage.getItem('state')
  if (state !== savedState) {
    throw new Error('Invalid state (CSRF protection)')
  }
}

function verifyNonce(nonce: string) {
  const savedNonce = localStorage.getItem('nonce')
  if (nonce !== savedNonce) {
    throw new Error('Invalid nonce (replay protection)')
  }
}

function trackEvent() {
  const savedDeviceId = localStorage.getItem('device_id')
  const decodedIdToken = JSON.parse(localStorage.getItem('decoded_id_token')!)
  const distinctId = decodedIdToken.payload.futurepass.toLowerCase()

  demoMixpanel.track('user_login_callback', {
    $distinct_id: distinctId,
    $device_id: savedDeviceId,
    user_login_at: Date.now(),
  })

  console.log(savedDeviceId, distinctId)
}
