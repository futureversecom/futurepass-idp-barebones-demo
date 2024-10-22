import { clientId, redirectUri, tokenEndpoint } from '../../config'
import { parseJwt } from '../../helpers'
import { DecodedIdToken } from '../../types'
import { demoMixpanel } from '../mixpanel/mixpanel'
import { logout, refreshTokens, silentLogin } from './auth'
import { sendTransaction, signMessage, signTransaction } from './transactions'

displayAuthorizationCode()
handleCallback()

let decodedIdToken: DecodedIdToken
let refreshToken: string

async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

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
    code_verifier: codeVerifier!,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const tokenEndpointResponse = await response.json()
  decodedIdToken = parseJwt(tokenEndpointResponse.id_token)

  if (!decodedIdToken) {
    throw new Error('Invalid JWT token')
  }

  verifyNonce(decodedIdToken.payload.nonce)

  displayTokenResponse(tokenEndpointResponse)
  refreshToken = tokenEndpointResponse.refresh_token
  displayDecodedIdToken(decodedIdToken)

  trackEevent()
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

function displayAuthorizationCode() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code) {
    document.getElementById('authorization-code')!.innerHTML = code
  }
}

function displayTokenResponse(response: any) {
  document.getElementById('token-response')!.innerText = JSON.stringify(
    response,
    null,
    2,
  )
}

function displayDecodedIdToken(decodedToken: any) {
  document.getElementById('id-token-decoded')!.innerText = JSON.stringify(
    decodedToken,
    null,
    2,
  )
}

function trackEevent() {
  const savedDeviceId = localStorage.getItem('device_id')
  const distinctId = decodedIdToken.payload.futurepass.toLowerCase()

  // demoMixpanel.identify(distinctId);

  demoMixpanel.track('user_login_callback', {
    $distinct_id: distinctId,
    $device_id: savedDeviceId,
    user_login_at: Date.now(),
  })

  console.log(savedDeviceId, distinctId)
}

const signMsgCallbackUrl = (
  document.getElementById('sign-message-callback-url')! as HTMLInputElement
).value

document
  .getElementById('sign-message-button')!
  .addEventListener('click', () => {
    signMessage(
      decodedIdToken,
      signMsgCallbackUrl != null &&
        (
          document.getElementById(
            'sign-message-callback-enabled',
          )! as HTMLInputElement
        ).checked
        ? signMsgCallbackUrl
        : undefined,
    )
  })

const signTxCallbackUrl = (
  document.getElementById('sign-tx-callback-url')! as HTMLInputElement
).value

document
  .getElementById('sign-tx-button')!
  .addEventListener('click', async () => {
    document.getElementById('send-tx-resp')!.innerText = ''
    await signTransaction(
      decodedIdToken,
      signTxCallbackUrl != null &&
        (
          document.getElementById(
            'sign-message-callback-enabled',
          )! as HTMLInputElement
        ).checked
        ? signTxCallbackUrl
        : undefined,
    )
  })

document
  .getElementById('send-tx-button')!
  .addEventListener('click', async () => {
    await sendTransaction(decodedIdToken)
  })

document.getElementById('logout')!.addEventListener('click', async () => {
  await logout()
})

document
  .getElementById('silent-login-button')!
  .addEventListener('click', async () => {
    await silentLogin(decodedIdToken)
  })

document
  .getElementById('refresh-tokens-button')!
  .addEventListener('click', async () => {
    const refreshedTokens = await refreshTokens(refreshToken)
    refreshToken = refreshedTokens.refresh_token
    displayTokenResponse(refreshedTokens)
  })

document
  .getElementById('sign-message-callback-enabled')!
  .addEventListener('change', (e: Event) => {
    const checkbox = e.target as HTMLInputElement
    const callbackUrlInput = document.getElementById(
      'sign-message-callback-url',
    )! as HTMLInputElement
    callbackUrlInput.disabled = !checkbox.checked
  })

document
  .getElementById('sign-tx-callback-enabled')!
  .addEventListener('change', (e: Event) => {
    const checkbox = e.target as HTMLInputElement
    const callbackUrlInput = document.getElementById(
      'sign-tx-callback-url',
    )! as HTMLInputElement
    callbackUrlInput.disabled = !checkbox.checked
  })
