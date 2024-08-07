import {
  clientId,
  redirectUri,
  tokenEndpoint,
  custodialSignerUrl,
  alchemyJsonRpcProviderUrl,
  transaction_to_address,
  transaction_chain_id,
  identityProviderUri,
} from '../../config';
import { parseJwt, base64UrlEncode } from '../../helpers';
import { signMessageErrorType, signMessageType } from '../../types';
import { either as E } from 'fp-ts';
import { ethers } from 'ethers';
import { login } from '../login/auth';

document
  .getElementById('sign-message-button')!
  .addEventListener('click', () => {
    signMessage();
  });

document
  .getElementById('sign-tx-button')!
  .addEventListener('click', async () => {
    await signTransaction();
  });

document
  .getElementById('send-tx-button')!
  .addEventListener('click', async () => {
    await sendTransaction();
  });

document.getElementById('logout')!.addEventListener('click', async () => {
  await logout();
});

document
  .getElementById('silent-login-button')!
  .addEventListener('click', async () => {
    await silentLogin();
  });

document
  .getElementById('sign-message-callback-enabled')!
  .addEventListener('change', (e: Event) => {
    const checkbox = e.target as HTMLInputElement;
    const callbackUrlInput = document.getElementById(
      'sign-message-callback-url'
    )! as HTMLInputElement;
    callbackUrlInput.disabled = !checkbox.checked;
  });

document
  .getElementById('sign-tx-callback-enabled')!
  .addEventListener('change', (e: Event) => {
    const checkbox = e.target as HTMLInputElement;
    const callbackUrlInput = document.getElementById(
      'sign-tx-callback-url'
    )! as HTMLInputElement;
    callbackUrlInput.disabled = !checkbox.checked;
  });

displayAuthorizationCode();
handleCallback();

let decodedIdToken: { payload: any; header?: any; signature?: string };
let transactionSignature: string | undefined;

const provider = new ethers.JsonRpcProvider(alchemyJsonRpcProviderUrl);
const rawTransactionWithoutSignature = {
  to: transaction_to_address,
  value: ethers.parseEther('0.001'),
  chainId: transaction_chain_id,
  gasLimit: 210000,
  gasPrice: ethers.parseUnits('10.0', 'gwei'),
};
let nonce = 0;

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (!code || !state) {
    throw new Error('Missing code or state in the callback');
  }

  verifyState(state);

  const codeVerifier = localStorage.getItem('code_verifier');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code!,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier!,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const tokenEndpointResponse = await response.json();
  decodedIdToken = parseJwt(tokenEndpointResponse.id_token);

  if (!decodedIdToken) {
    throw new Error('Invalid JWT token');
  }

  verifyNonce(decodedIdToken.payload.nonce);

  displayTokenResponse(tokenEndpointResponse);
  displayDecodedIdToken(decodedIdToken);
}

function verifyState(state: string) {
  const savedState = localStorage.getItem('state');
  if (state !== savedState) {
    throw new Error('Invalid state (CSRF protection)');
  }
}

function verifyNonce(nonce: string) {
  const savedNonce = localStorage.getItem('nonce');
  if (nonce !== savedNonce) {
    throw new Error('Invalid nonce (replay protection)');
  }
}

function displayAuthorizationCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    document.getElementById('authorization-code')!.innerHTML = code;
  }
}

function displayTokenResponse(response: any) {
  document.getElementById('token-response')!.innerText = JSON.stringify(
    response,
    null,
    2
  );
}

function displayDecodedIdToken(decodedToken: any) {
  document.getElementById('id-token-decoded')!.innerText = JSON.stringify(
    decodedToken,
    null,
    2
  );
}

function logout() {
  localStorage.clear();
  window.location.href = `${identityProviderUri}/logout`;
}

function signMessage() {
  const message =
    (document.getElementById('sign-message-input')! as HTMLInputElement)
      .value ?? '0x65Aa45B043f360887fD0fA18A4E137e036F5A708';

  if (typeof window === 'undefined') {
    return;
  }

  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account');
    return;
  }

  const callbackUrl = (
    document.getElementById('sign-message-callback-url')! as HTMLInputElement
  ).value;

  const callbackEnabled = (
    document.getElementById(
      'sign-message-callback-enabled'
    )! as HTMLInputElement
  ).checked;

  const signMessagePayload = {
    account: decodedIdToken.payload.eoa,
    message,
    callbackUrl:
      callbackUrl != null && callbackEnabled ? callbackUrl : undefined,
  };

  const id = 'client:1';
  const tag = 'fv/sign-msg';

  const encodedPayload = {
    id,
    tag,
    payload: signMessagePayload,
  };

  const signerUrl =
    custodialSignerUrl +
    '?request=' +
    base64UrlEncode(JSON.stringify(encodedPayload));

  document.getElementById('sign-message-sig')!.innerHTML = `
    <div >
      <pre><code>${JSON.stringify(
        { encodedPayload, signerUrl },
        null,
        2
      )}</code></pre>
    </div>
  `;

  window.open(
    signerUrl,
    'futureverse_wallet',
    'popup,right=0,width=290,height=286,menubar=no,toolbar=no,location=no,status=0'
  );

  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = signMessageType.decode(ev.data);
      if (E.isRight(dataR)) {
        const signature = dataR.right.payload.response.signature;

        document.getElementById('sign-message-sig')!.innerText = JSON.stringify(
          signature,
          null,
          2
        );
      }

      const errorDataR = signMessageErrorType.decode(ev.data);

      if (E.isRight(errorDataR)) {
        const errorCode = errorDataR.right.payload.error.error.code;

        document.getElementById('sign-message-sig')!.innerText = JSON.stringify(
          errorCode,
          null,
          2
        );
      }
    }
  });
}

async function signTransaction() {
  const fromAccount = decodedIdToken.payload.eoa;

  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account');
    return;
  }

  const transactionCount = await provider.getTransactionCount(
    decodedIdToken.payload.eoa
  );

  nonce = transactionCount;

  const serializedUnsignedTransaction = ethers.Transaction.from({
    ...rawTransactionWithoutSignature,
    nonce,
  }).unsignedSerialized;

  if (typeof window === 'undefined') {
    return;
  }

  const callbackUrl = (
    document.getElementById('sign-tx-callback-url')! as HTMLInputElement
  ).value;

  const callbackEnabled = (
    document.getElementById('sign-tx-callback-enabled')! as HTMLInputElement
  ).checked;

  const signTransactionPayload = {
    account: fromAccount,
    transaction: serializedUnsignedTransaction,
    callbackUrl:
      callbackUrl != null && callbackEnabled ? callbackUrl : undefined,
  };

  const id = 'client:2';
  const tag = 'fv/sign-tx';

  const encodedPayload = {
    id,
    tag,
    payload: signTransactionPayload,
  };

  const signerUrl =
    custodialSignerUrl +
    '?request=' +
    base64UrlEncode(JSON.stringify(encodedPayload));

  document.getElementById('sign-tx-sig')!.innerHTML = `
    <div >
      <pre><code>${JSON.stringify(
        { encodedPayload, signerUrl },
        null,
        2
      )}</code></pre>
    </div>
  `;

  window.open(
    signerUrl,
    'futureverse_wallet',
    'popup,right=0,width=290,height=286,menubar=no,toolbar=no,location=no,status=0'
  );

  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = signMessageType.decode(ev.data);
      if (E.isRight(dataR)) {
        transactionSignature = dataR.right.payload.response.signature;
        document.getElementById('sign-tx-sig')!.innerText = JSON.stringify(
          transactionSignature,
          null,
          2
        );
      }

      const errorDataR = signMessageErrorType.decode(ev.data);

      if (E.isRight(errorDataR)) {
        const errorCode = errorDataR.right.payload.error.error.code;

        document.getElementById('sign-tx-sig')!.innerText = JSON.stringify(
          errorCode,
          null,
          2
        );
      }
    }
  });
}

async function sendTransaction() {
  if (decodedIdToken.payload.custodian !== 'fv') {
    alert('not a custodial account');
    return;
  }

  if (transactionSignature == null || decodedIdToken.payload.eoa == null) {
    return;
  }

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    signature: transactionSignature,
    from: decodedIdToken.payload.eoa,
    nonce,
  };

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature
  ).serialized;

  const transactionResponse = await provider.broadcastTransaction(
    serializedSignedTransaction
  );

  document.getElementById('send-tx-resp')!.innerText = JSON.stringify(
    transactionResponse,
    null,
    2
  );
}

async function silentLogin() {
  await login('silent', decodedIdToken.payload.eoa);
}
