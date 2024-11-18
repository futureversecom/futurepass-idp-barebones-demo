import { randomBytes, uuidV4 } from 'ethers'
import {
  authorizationEndpoint,
  clientId,
  identityProviderUri,
  tokenEndpoint,
} from './config'
import {
  generateCodeVerifierAndChallenge,
  generateRandomString,
  openURL,
  localStorage,
  redirectUri,
} from './helpers'
import { demoMixpanel } from './mixpanel'
import { DecodedIdToken } from './types'
import { IframeNavigator } from './iframe-navigator'

export async function login(
  loginType:
    | 'google'
    | 'facebook'
    | 'apple'
    | 'discord'
    | 'roblox'
    | 'email'
    | 'idp-f'
    | 'silent',
  targetEoa?: string,
  targetGameEngine?: 'unity' | 'unreal',
) {
  console.log(`login with ${loginType} called`)
  let codeChallenge = ''
  if (loginType != 'silent') {
    const { codeVerifier, codeChallenge: _codeChallenge } =
      await generateCodeVerifierAndChallenge()
    codeChallenge = _codeChallenge
    localStorage.setItem('code_verifier', codeVerifier)
  } else {
    localStorage.removeItem('code_verifier')
  }

  const state = generateRandomString(16)
  localStorage.setItem('state', state)

  const nonce = generateRandomString(16)
  localStorage.setItem('nonce', nonce)

  let device_id = localStorage.getItem('device_id')
  if (device_id == null) {
    device_id = uuidV4(randomBytes(32)) // used for tracking anonymous user actions on the frontend

    // this is an example of showing how to track the event for an anonymous user before login
    localStorage.setItem('device_id', device_id)
    demoMixpanel.track('device_id_created', {
      $device_id: device_id,
      device_id_created_at: Date.now(),
    })
  }

  const commonParams = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid',
    state,
    ...(loginType != 'silent' ? {
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_mode: 'query',
      nonce,
      device_id,
    } : {}),
    prompt: loginType == 'silent' ? 'none' : 'login', // Use `none` to attempt silent authentication without prompting the user
  }

  let query
  switch (loginType) {
    case 'email':
      query = { ...commonParams, login_hint: 'email:' }
      break
    case 'facebook':
      query = { ...commonParams, login_hint: 'social:facebook' }
      break
    case 'google':
      query = { ...commonParams, login_hint: 'social:google' }
      break
    case 'apple':
      query = { ...commonParams, login_hint: 'social:apple' }
      break
    case 'discord':
      query = { ...commonParams, login_hint: 'social:discord' }
      break
    case 'roblox':
      query = { ...commonParams, login_hint: 'social:roblox' }
      break
    case 'silent':
      if (targetEoa) {
        query = { ...commonParams, prompt: 'none', login_hint: targetEoa }
        console.log(query)
        break
      }
    case 'idp-f':
      // for idp-f we don't pass login_hint just commonParams
      const login_hint =
        targetGameEngine === 'unity'
          ? 'game:unity:'
          : targetGameEngine === 'unreal'
            ? 'game:unreal:'
            : undefined

      if (login_hint) {
        query = { ...commonParams, login_hint }
      } else {
        query = commonParams
      }
  }

  const queryString = new URLSearchParams(query).toString()
  const url = `${authorizationEndpoint}?${queryString}`

  openURL(url, 'redirect')
}

export async function logout(params?: {
  isLegacy?: boolean,
  disableConsent?: boolean,
  isSilent?: boolean,
  postRedirectUri?: boolean,
}) {

  const urlParams = new URLSearchParams({
    ...(params?.disableConsent ? { disable_consent: 'true' } : {}),
    ...(params?.postRedirectUri ? {
      post_logout_redirect_uri: redirectUri,
      id_token_hint: localStorage.getItem('id_token') || '',
      client_id: clientId,
    } : {}),
  })

  localStorage.clear()

  if (params?.isSilent) {
    const navigator = new IframeNavigator()
    urlParams.append('response_mode', 'web_message')
    await navigator.navigate({
      url: `${identityProviderUri}/session/end?${urlParams.toString()}`
    })
  } else {
    openURL(`${identityProviderUri}/${params?.isLegacy ? "logout" : "session/end"}?${urlParams.toString()}`, 'redirect')
  }
}

export async function silentLogin(decodedIdToken: DecodedIdToken) {
  await login('silent', decodedIdToken.payload.eoa)
}

export async function refreshTokens(refreshToken: string) {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.error_description ||
        errorData.error ||
        'Failed to refresh tokens',
      )
    }

    const tokens = await response.json()
    return tokens
  } catch (error) {
    if (error instanceof Error) {
      document.getElementById('refresh-tokens-error')!.innerText =
        `Token refresh failed: ${error.message}`
      return
    }
    document.getElementById('refresh-tokens-error')!.innerText =
      'Token refresh failed with unknown error'
  }
}
