const clientId = 'N8LvGuOdY5CeduNUGdUwB'
const accessToken = '80rEBd2wrPkd4KZg33JQGFN0ILK-_bry5GWSjtadJJL'
const redirectUri = 'http://localhost:3000/callback'
const identityProviderUri = 'https://login.futureverse.dev'
const authorizationEndpoint = `${identityProviderUri}/auth`
const tokenEndpoint = `${identityProviderUri}/token`
const userInfoEndpoint = `${identityProviderUri}/userinfo`

function base64UrlDecode(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = str + padding
  return atob(base64)
}

function parseJwt(token: string) {
  const [header, payload, signature] = token.split('.')

  if (!header || !payload) {
    throw new Error('Invalid JWT token')
  }

  const decodedHeader = JSON.parse(base64UrlDecode(header))
  const decodedPayload = JSON.parse(base64UrlDecode(payload))

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature,
  }
}

function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function base64UrlEncode(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function sha256(buffer: ArrayBuffer) {
  return crypto.subtle.digest('SHA-256', buffer)
}

async function generateCodeVerifierAndChallenge() {
  const codeVerifier = generateRandomString(128)
  const buffer = new TextEncoder().encode(codeVerifier)
  const hashed = await sha256(buffer)
  const codeChallenge = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(hashed))
  )
  return { codeVerifier, codeChallenge }
}

async function login() {
  console.log('login func')
  const { codeVerifier, codeChallenge } =
    await generateCodeVerifierAndChallenge()
  localStorage.setItem('code_verifier', codeVerifier)

  // const params = {
  //   response_type: 'code',
  //   client_id: clientId,
  //   redirect_uri: redirectUri,
  //   scope: 'openid profile email',
  //   code_challenge: codeChallenge,
  //   code_challenge_method: 'S256',
  //   login_hint: 'email:',
  // }

  const params = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid',
    // state: '458a290ea2084a76b9d5df481e8c984c',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_mode: 'query',
    prompt: 'login',
    login_hint: 'email:',
  }

  const queryString = new URLSearchParams(params).toString()
  const url = `${authorizationEndpoint}?${queryString}`

  window.location.href = url
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (!code) {
    return
  }

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
  const decodedIdToken = parseJwt(tokenEndpointResponse.id_token)
  console.log('🚀 ~ handleCallback ~ decodedIdToken:', decodedIdToken)

  if (!decodedIdToken) {
    throw new Error('Invalid JWT token')
  }

  console.log('data', tokenEndpointResponse)

  document.getElementById('token-response')!.innerText = JSON.stringify(
    tokenEndpointResponse,
    null,
    2
  )
  document.getElementById('id-token-decoded')!.innerText = JSON.stringify(
    decodedIdToken,
    null,
    2
  )
}

function displayAuthorizationCode() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (!code) {
    return
  }

  document.getElementById('authorization-code')!.innerHTML = code
}

if (window.location.pathname === '/callback') {
  displayAuthorizationCode()
  handleCallback()
}

document.getElementById('login-button')!.addEventListener('click', login)
