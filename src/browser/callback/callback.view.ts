import {
  DecodedIdToken,
  logout,
  refreshTokens,
  silentLogin,
  sendTransaction,
  signEthTransaction,
  signMessage,
  signRootTransaction,
  processCallback,
  getDecodedIdToken,
  parseJwt,
} from 'shared'

let decodedIdToken: DecodedIdToken
let refreshToken: string

async function handleCallback() {
  const data = await processCallback(window.location.search)
  if(!data) {
    return
  }
  decodedIdToken = data.decodedIdToken
  refreshToken = data.refreshToken

  displayAuthorizationCode(data.code)
  displayTokenResponse(data.tokenEndpointResponse)
  displayDecodedIdToken(data.decodedIdToken)
}
handleCallback()
.catch((err) => alert(err.message))

function displayAuthorizationCode(code: string) {
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

const signMsgCallbackUrl = (
  document.getElementById('sign-message-callback-url')! as HTMLInputElement
).value

document
  .getElementById('sign-message-button')!
  .addEventListener('click', async () => {
    const message =
      (document.getElementById('sign-message-input')! as HTMLInputElement)
        .value ?? '0x65Aa45B043f360887fD0fA18A4E137e036F5A708'

    const callbackUrl =
      signMsgCallbackUrl != null &&
      (
        document.getElementById(
          'sign-message-callback-enabled',
        )! as HTMLInputElement
      ).checked
        ? signMsgCallbackUrl
        : undefined

    const signatureResponse = await signMessage(
      message,
      callbackUrl,
      (encodedPayload) => {
        document.getElementById('sign-message-payload')!.innerText =
          JSON.stringify(encodedPayload, null, 2)
      },
    )

    document.getElementById('sign-message-resp')!.innerText = JSON.stringify(
      signatureResponse,
      null,
      2,
    )
  })

const signTxCallbackUrl = (
  document.getElementById('sign-tx-callback-url')! as HTMLInputElement
).value

document
  .getElementById('sign-eth-tx-button')!
  .addEventListener('click', async () => {
    document.getElementById('send-tx-resp')!.innerText = ''
    const callbackUrl =
      signTxCallbackUrl != null &&
      (document.getElementById('sign-tx-callback-enabled')! as HTMLInputElement)
        .checked
        ? signTxCallbackUrl
        : undefined

    const signatureResponse = await signEthTransaction(
      getDecodedIdToken().payload.eoa,
      undefined,
      undefined,
      callbackUrl,
      (encodedPayload) => {
        document.getElementById('sign-tx-signer-payload')!.innerText =
          JSON.stringify(encodedPayload, null, 2)
      },
    )
    document.getElementById('sign-tx-sig-response')!.innerText = JSON.stringify(
      signatureResponse,
      null,
      2,
    )
  })

document
  .getElementById('send-eth-tx-button')!
  .addEventListener('click', async () => {
    const serializedSignedTransaction = JSON.parse(
      document.getElementById('sign-tx-sig-response')!.innerText,
    )?.data?.serializedSignedTransaction
    if (!serializedSignedTransaction) {
      alert('Please sign a transaction first')
    }
    try {
      const receipt = await sendTransaction(serializedSignedTransaction)
      document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
        receipt,
        null,
        2,
      )
    } catch (e) {
      document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
        e,
        null,
        2,
      )
    }
  })

document
  .getElementById('sign-root-tx-button')!
  .addEventListener('click', async () => {
    document.getElementById('send-tx-resp')!.innerText = ''
    const callbackUrl =
      signTxCallbackUrl != null &&
      (document.getElementById('sign-tx-callback-enabled')! as HTMLInputElement)
        .checked
        ? signTxCallbackUrl
        : undefined

    const signatureResponse = await signRootTransaction(
      getDecodedIdToken().payload.eoa,
      undefined,
      undefined,
      callbackUrl,
      (encodedPayload) => {
        document.getElementById('sign-tx-signer-payload')!.innerText =
          JSON.stringify(encodedPayload, null, 2)
      },
    )
    document.getElementById('sign-tx-sig-response')!.innerText = JSON.stringify(
      signatureResponse,
      null,
      2,
    )
  })

document
  .getElementById('send-root-tx-button')!
  .addEventListener('click', async () => {
    const serializedSignedTransaction = JSON.parse(
      document.getElementById('sign-tx-sig-response')!.innerText,
    )?.data?.serializedSignedTransaction
    if (!serializedSignedTransaction) {
      alert('Please sign a transaction first')
    }
    try {
      const receipt = await sendTransaction(serializedSignedTransaction)
      document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
        receipt,
        null,
        2,
      )
    } catch (e) {
      document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
        e,
        null,
        2,
      )
    }
  })

document.getElementById('legacy-logout')!.addEventListener('click', async () => {
  await logout({ isLegacy: true })
})

document.getElementById('consent-logout')!.addEventListener('click', async () => {
  await logout()
})

document.getElementById('no-consent-logout')!.addEventListener('click', async () => {
  await logout({ disableConsent: true })
})

document.getElementById('consent-logout-redirect')!.addEventListener('click', async () => {
  await logout({ postRedirectUri: true })
})

document.getElementById('no-consent-logout-redirect')!.addEventListener('click', async () => {
  await logout({ disableConsent: true, postRedirectUri: true })
})

document.getElementById('silent-logout')!.addEventListener('click', async () => {
  await logout({ isSilent: true })
  alert('Logout successful')
})

document
  .getElementById('refresh-tokens-button')!
  .addEventListener('click', async () => {
    const refreshedTokens = await refreshTokens(refreshToken)
    refreshToken = refreshedTokens.refresh_token
    displayTokenResponse(refreshedTokens)
    displayDecodedIdToken(parseJwt(refreshedTokens.id_token))
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
