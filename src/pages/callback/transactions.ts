import { ethers } from 'ethers'
import { either as E } from 'fp-ts'
import { v4 as uuidV4 } from 'uuid'
import {
  XRP_PRECOMPILE_ADDRESS,
  custodialSignerUrl,
  ethChainId,
  ethReceiverAddress,
  identityProviderUri,
  providers,
  rootChainId,
  rootReceiverAddress,
  xrpERC20Precompile,
} from '../../config'
import { base64UrlEncode } from '../../helpers'
import { DecodedIdToken, SignMessage, SignMessageError } from '../../types'

let transactionSignature: string | undefined
let rawTransactionWithoutSignature: object | null = null

export function signMessage(
  decodedIdToken: DecodedIdToken,
  callbackUrl?: string,
) {
  const message =
    (document.getElementById('sign-message-input')! as HTMLInputElement)
      .value ?? '0x65Aa45B043f360887fD0fA18A4E137e036F5A708'

  if (typeof window === 'undefined') {
    return
  }

  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account')
    return
  }

  const signMessagePayload = {
    account: decodedIdToken.payload.eoa,
    message,
    callbackUrl,
    idpUrl: identityProviderUri,
  }

  const id = `client:${uuidV4()}`
  const tag = 'fv/sign-msg'

  const encodedPayload = {
    id,
    tag,
    payload: signMessagePayload,
  }

  const signerUrl =
    custodialSignerUrl +
    '?request=' +
    base64UrlEncode(JSON.stringify(encodedPayload))

  document.getElementById('sign-message-sig')!.innerHTML = `
    <div >
      <pre><code>${JSON.stringify(
        { encodedPayload, signerUrl },
        null,
        2,
      )}</code></pre>
    </div>
  `

  window.open(
    signerUrl,
    'futureverse_wallet',
    'popup,right=0,width=290,height=480,menubar=no,toolbar=no,location=no,status=0',
  )

  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = SignMessage.decode(ev.data)
      if (E.isRight(dataR)) {
        const signature = dataR.right.payload.response.signature

        document.getElementById('sign-message-sig')!.innerText = JSON.stringify(
          signature,
          null,
          2,
        )
      }

      const errorDataR = SignMessageError.decode(ev.data)

      if (E.isRight(errorDataR)) {
        const errorCode = errorDataR.right.payload.error.error.code

        document.getElementById('sign-message-sig')!.innerText = JSON.stringify(
          errorCode,
          null,
          2,
        )
      }
    }
  })
}

export async function signEthTransaction(
  decodedIdToken: DecodedIdToken,
  callbackUrl?: string,
) {
  const fromAccount = decodedIdToken.payload.eoa

  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account')
    return
  }

  // Fetch the current nonce
  const nonce = await providers.eth.getTransactionCount(fromAccount)
  const sendAmount = ethers.parseEther('0.0001').toString()

  const gasLimit = await providers.eth.estimateGas({
    to: ethReceiverAddress,
    value: sendAmount,
  })

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await providers.eth.getFeeData()

  // EIP1559 Transaction
  rawTransactionWithoutSignature = {
    to: ethReceiverAddress,
    value: sendAmount,
    chainId: ethChainId,
    gasLimit: gasLimit.toString(),
    maxFeePerGas: maxFeePerGas?.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
    nonce,
  }

  const serializedUnsignedTransaction = ethers.Transaction.from(
    rawTransactionWithoutSignature,
  ).unsignedSerialized

  if (typeof window === 'undefined') {
    return
  }

  document.getElementById('raw-transaction')!.innerHTML = `
  <div >
    <pre><code>${JSON.stringify(
      {
        raw: rawTransactionWithoutSignature,
        serialized: serializedUnsignedTransaction,
      },
      null,
      2,
    )}</code></pre>
  </div>
  `

  const signTransactionPayload = {
    account: fromAccount,
    transaction: serializedUnsignedTransaction,
    idpUrl: identityProviderUri,
    callbackUrl,
  }

  const id = `client:${uuidV4()}`
  const tag = 'fv/sign-tx'

  const encodedPayload = {
    id,
    tag,
    payload: signTransactionPayload,
  }

  const signerUrl =
    custodialSignerUrl +
    '?request=' +
    base64UrlEncode(JSON.stringify(encodedPayload))

  document.getElementById('sign-tx-sig')!.innerHTML = `
    <div >
      <pre><code>${JSON.stringify(
        { encodedPayload, signerUrl },
        null,
        2,
      )}</code></pre>
    </div>
  `

  window.open(
    signerUrl,
    'futureverse_wallet',
    'popup,right=0,width=290,height=486,menubar=no,toolbar=no,location=no,status=0',
  )

  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = SignMessage.decode(ev.data)
      if (E.isRight(dataR)) {
        transactionSignature = dataR.right.payload.response.signature
        document.getElementById('sign-tx-sig-response')!.innerText =
          JSON.stringify(transactionSignature, null, 2)
      }

      const errorDataR = SignMessageError.decode(ev.data)

      if (E.isRight(errorDataR)) {
        const errorCode = errorDataR.right.payload.error.error.code

        document.getElementById('sign-tx-sig')!.innerText = JSON.stringify(
          errorCode,
          null,
          2,
        )
      }
    }
  })
}

export async function sendEthTransaction(decodedIdToken: DecodedIdToken) {
  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account')
    return
  }

  if (transactionSignature == null || decodedIdToken.payload.eoa == null) {
    return
  }

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    signature: transactionSignature,
    from: decodedIdToken.payload.eoa,
  }

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature,
  ).serialized

  document.getElementById('sending-signed-tx')!.innerHTML = `
  <div >
    <pre><code>${JSON.stringify(
      {
        raw: rawTransactionWithSignature,
        serialized: serializedSignedTransaction,
      },
      null,
      2,
    )}</code></pre>
  </div>
`

  try {
    const transactionResponse = await providers.eth.broadcastTransaction(
      serializedSignedTransaction,
    )

    document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
      transactionResponse,
      null,
      2,
    )

    // Wait for the transaction to be mined
    const receipt = await transactionResponse.wait()
    console.log('Transaction mined:', receipt)
    document.getElementById('send-tx-resp')!.innerText +=
      '\n\nTransaction mined:\n' + JSON.stringify(receipt, null, 2)
  } catch (error) {
    console.error('Error sending transaction:', error)
    document.getElementById('send-tx-resp')!.innerText =
      'Error sending transaction: ' + JSON.stringify(error, null, 2)
  }
}

export async function signRootTransaction(
  decodedIdToken: DecodedIdToken,
  callbackUrl?: string,
) {
  const fromAccount = decodedIdToken.payload.eoa

  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account')
    return
  }
  const nonce = await providers.root.getTransactionCount(fromAccount)

  const sendAmount = '1'
  const gasLimit = await providers.root.estimateGas({
    to: XRP_PRECOMPILE_ADDRESS,
    data: xrpERC20Precompile.interface.encodeFunctionData('transfer', [
      rootReceiverAddress,
      sendAmount,
    ]),
  })

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await providers.root.getFeeData()

  rawTransactionWithoutSignature = {
    to: XRP_PRECOMPILE_ADDRESS,
    data: xrpERC20Precompile.interface.encodeFunctionData('transfer', [
      rootReceiverAddress,
      sendAmount,
    ]),
    chainId: rootChainId,
    gasLimit: gasLimit.toString(),
    maxFeePerGas: maxFeePerGas?.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
    nonce: nonce,
  }

  const serializedUnsignedTransaction = ethers.Transaction.from(
    rawTransactionWithoutSignature,
  ).unsignedSerialized

  if (typeof window === 'undefined') {
    return
  }

  document.getElementById('raw-transaction')!.innerHTML = `
  <div >
    <pre><code>${JSON.stringify(
      {
        raw: rawTransactionWithoutSignature,
        serialized: serializedUnsignedTransaction,
      },
      null,
      2,
    )}</code></pre>
  </div>
  `

  const signTransactionPayload = {
    account: fromAccount,
    transaction: serializedUnsignedTransaction,
    idpUrl: identityProviderUri,
    callbackUrl,
  }

  const id = `client:${uuidV4()}`
  const tag = 'fv/sign-tx'

  const encodedPayload = {
    id,
    tag,
    payload: signTransactionPayload,
  }

  const signerUrl =
    custodialSignerUrl +
    '?request=' +
    base64UrlEncode(JSON.stringify(encodedPayload))

  document.getElementById('sign-tx-sig')!.innerHTML = `
    <div >
      <pre><code>${JSON.stringify(
        { encodedPayload, signerUrl },
        null,
        2,
      )}</code></pre>
    </div>
  `

  window.open(
    signerUrl,
    'futureverse_wallet',
    'popup,right=0,width=290,height=486,menubar=no,toolbar=no,location=no,status=0',
  )

  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = SignMessage.decode(ev.data)
      if (E.isRight(dataR)) {
        transactionSignature = dataR.right.payload.response.signature
        document.getElementById('sign-tx-sig-response')!.innerText =
          JSON.stringify(transactionSignature, null, 2)
      }

      const errorDataR = SignMessageError.decode(ev.data)

      if (E.isRight(errorDataR)) {
        const errorCode = errorDataR.right.payload.error.error.code

        document.getElementById('sign-tx-sig')!.innerText = JSON.stringify(
          errorCode,
          null,
          2,
        )
      }
    }
  })
}

export async function sendRootTransaction(decodedIdToken: DecodedIdToken) {
  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account')
    return
  }

  if (transactionSignature == null || decodedIdToken.payload.eoa == null) {
    return
  }

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    signature: transactionSignature,
  }

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature,
  ).serialized

  document.getElementById('sending-signed-tx')!.innerHTML = `
  <div >
    <pre><code>${JSON.stringify(
      {
        raw: rawTransactionWithSignature,
        serialized: serializedSignedTransaction,
      },
      null,
      2,
    )}</code></pre>
  </div>
`

  try {
    const transactionResponse = await providers.root.broadcastTransaction(
      serializedSignedTransaction,
    )

    document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
      transactionResponse,
      null,
      2,
    )

    // Wait for the transaction to be mined
    const receipt = await transactionResponse.wait()
    console.log('Transaction mined:', receipt)
    document.getElementById('send-tx-resp')!.innerText +=
      '\n\nTransaction mined:\n' + JSON.stringify(receipt, null, 2)
  } catch (error) {
    console.error('Error sending transaction:', error)
    document.getElementById('send-tx-resp')!.innerText =
      'Error sending transaction: ' + JSON.stringify(error, null, 2)
  }
}
