import { DecodedIdToken } from 'src/types'
import { clientId, identityProviderUri, tokenEndpoint } from '../../config'
import { login } from '../login/auth'

export function logout() {
  localStorage.clear()
  window.location.href = `${identityProviderUri}/logout`
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
