import { ethers, Transaction } from 'ethers'
import { TransactionType, base64UrlDecode, sendTransaction } from 'shared'

type Hex = string

let transactionType: TransactionType

type SignMessageResponse = {
  tag: 'fv/sign-msg'
  payload: {
    account: Hex
    message: Hex
  }
  result:
    | { status: 'success'; data: { signature: Hex } }
    | { status: 'error'; data: { error: string } }
}
type SignTransactionResponse = {
  tag: 'fv/sign-tx'
  payload: {
    account: Hex
    transaction: Hex
  }
  result:
    | { status: 'success'; data: { signature: Hex } }
    | { status: 'error'; data: { error: string } }
}
type Response = SignMessageResponse | SignTransactionResponse

const params = new URLSearchParams(window.location.search)
const response = params.get('response')
const responseJson = JSON.parse(base64UrlDecode(response!)) as Response

document.getElementById('signature-data')!.innerHTML = `
  <div >
    <pre><code>${JSON.stringify(responseJson, null, 2)}</code></pre>
  </div>
`

function handleTransactionResponse(txRes: SignTransactionResponse) {
  const sendTransactionButton = document.createElement('button')

  if (txRes.result.status === 'error') {
    alert(`Error while signing transaction: ${txRes.result.data.error}`)
    return
  }

  sendTransactionButton.innerText = 'send transaction'
  sendTransactionButton.onclick = async () => {
    if (txRes.result.status === 'error') {
      return
    }

    const transactionObj = Transaction.from(txRes.payload.transaction)

    transactionObj.signature = txRes.result.data.signature

    const serializedSignedTransaction =
      ethers.Transaction.from(transactionObj).serialized

    const transactionResponse = await sendTransaction(
      serializedSignedTransaction,
    )

    document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
      transactionResponse,
      null,
      2,
    )
  }
  document.body.appendChild(sendTransactionButton)
}

function handleSignMessageResponse(res: SignMessageResponse) {
  if (res.result.status === 'error') {
    alert(`Error while signing message: ${res.result.data.error}`)
  }
}

if (responseJson.tag === 'fv/sign-tx') {
  handleTransactionResponse(responseJson)
} else if (responseJson.tag === 'fv/sign-msg') {
  handleSignMessageResponse(responseJson)
}
