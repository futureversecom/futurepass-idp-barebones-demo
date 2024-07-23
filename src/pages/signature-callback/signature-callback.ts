import { alchemyJsonRpcProviderUrl } from '../../config';
import * as ethers from 'ethers';

const params = new URLSearchParams(window.location.search);
const type = params.get('type');
const transaction = params.get('transaction');
const message = params.get('message');
const account = params.get('account');
const signature = params.get('signature');

document.getElementById('signature-data')!.innerHTML = `
  <div >
    <pre><code>${JSON.stringify(
      type === 'sign-transaction'
        ? { type, account, transaction, signature }
        : { type, account, message, signature },
      null,
      2
    )}</code></pre>
  </div>
`;

const provider = new ethers.JsonRpcProvider(alchemyJsonRpcProviderUrl);

if (type === 'sign-transaction') {
  // Create a new div element to show transaction result
  const sendTransactionButton = document.createElement('button');

  sendTransactionButton.innerText = 'send transaction';
  sendTransactionButton.onclick = async () => {
    const transactionObj = ethers.Transaction.from(transaction!);
    transactionObj.signature = signature;

    const serializedSignedTransaction =
      ethers.Transaction.from(transactionObj).serialized;

    const transactionResponse = await provider.broadcastTransaction(
      serializedSignedTransaction
    );

    document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
      transactionResponse,
      null,
      2
    );
  };
  document.body.appendChild(sendTransactionButton);
}
