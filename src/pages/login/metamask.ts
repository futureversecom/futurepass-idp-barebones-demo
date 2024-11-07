import { SiweMessage } from 'siwe'
import {
  authorizationEndpoint,
  clientId,
  identityProviderUri,
  redirectUri,
} from '../../config'
import {
  generateCodeVerifierAndChallenge,
  generateRandomString,
} from '../../helpers'
import { BrowserProvider, getAddress, randomBytes, uuidV4 } from 'ethers'
import { demoMixpanel } from '../mixpanel/mixpanel'

document
  .getElementById('login-button-metamask')!
  .addEventListener('click', loginWithMetamask)

async function loginWithMetamask() {
  console.log('login with metamask func')
  const thisWindow = window as any
  if (!thisWindow.ethereum) {
    alert('Metamask not installed')
    return
  }

  try {
    const provider = new BrowserProvider((window as any).ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])

    const account = getAddress(accounts[0])

    const msg = new SiweMessage({
      version: '1',
      issuedAt: new Date().toISOString(),
      address: account,
      uri: identityProviderUri,
      domain: typeof window === 'undefined' ? '' : window.location.host,
      chainId: 7672, // 7672 is for dev/staging, 7668 is for production
    })

    const signer = await provider.getSigner()

    const signature = await signer.signMessage(msg.prepareMessage())

    const siweParams = new URLSearchParams({
      nonce: msg.nonce,
      address: msg.address,
      issuedAt: msg.issuedAt!,
      domain: msg.domain,
      signature: signature,
    })
    const login_hint = 'eoa:' + siweParams.toString()

    const { codeVerifier, codeChallenge } =
      await generateCodeVerifierAndChallenge()
    localStorage.setItem('code_verifier', codeVerifier)

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

    const params = {
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid',
      response_mode: 'query',
      prompt: 'login', // Use `none` to attempt silent authentication without prompting the user
      login_hint,
      web3_connector_id: 'metamask',
    }

    const queryString = new URLSearchParams(params).toString()
    const url = `${authorizationEndpoint}?${queryString}`

    window.location.href = url
  } catch (error) {
    if ((error as any).code === 4001) {
      // User rejected the request
      console.error('User rejected the request')
    } else {
      console.error(
        'Error connecting to MetaMask or requesting signature:',
        error,
      )
    }
    return null
  }
}
