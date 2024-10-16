import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { either as E } from 'fp-ts'
import {
  chainId,
  custodialSignerUrl,
  jsonRpcProviderUrl,
  transactionToAddress,
} from '../../config'
import { base64UrlEncode } from '../../helpers'
import { DecodedIdToken, SignMessage, SignMessageError } from '../../types'

const provider = new JsonRpcProvider(jsonRpcProviderUrl)
let transactionSignature: string | undefined
let nonce = 0
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
  }

  const id = 'client:1'
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
    'popup,right=0,width=290,height=286,menubar=no,toolbar=no,location=no,status=0',
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

export async function signTransaction(
  decodedIdToken: DecodedIdToken,
  callbackUrl?: string,
) {
  const fromAccount = decodedIdToken.payload.eoa

  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account')
    return
  }

  // Fetch the current nonce
  const nonce = await provider.getTransactionCount(fromAccount)
  const fees = await provider.getFeeData()

  // EIP1559 Transaction
  rawTransactionWithoutSignature = {
    to: transactionToAddress,
    value: ethers.parseEther('0.001'),
    chainId: chainId,
    gasLimit: 21_000, // Only works for simple transfers
    maxFeePerGas: fees.lastBaseFeePerGas!.toString(),
    maxPriorityFeePerGas: 0,
    nonce,
  }

  const serializedUnsignedTransaction = ethers.Transaction.from(
    rawTransactionWithoutSignature,
  ).unsignedSerialized

  if (typeof window === 'undefined') {
    return
  }

  const signTransactionPayload = {
    account: fromAccount,
    transaction: serializedUnsignedTransaction,
    callbackUrl,
  }

  const id = 'client:2'
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
    'popup,right=0,width=290,height=286,menubar=no,toolbar=no,location=no,status=0',
  )

  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = SignMessage.decode(ev.data)
      if (E.isRight(dataR)) {
        transactionSignature = dataR.right.payload.response.signature
        document.getElementById('sign-tx-sig')!.innerText = JSON.stringify(
          transactionSignature,
          null,
          2,
        )
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

export async function sendTransaction(decodedIdToken: DecodedIdToken) {
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

  try {
    const transactionResponse = await provider.sendTransaction(
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
