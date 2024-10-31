import { ethers, Transaction } from 'ethers'
import {
  XRP_PRECOMPILE_ADDRESS,
  ethChainId,
  ethReceiverAddress,
  identityProviderUri,
  providers,
  rootChainId,
  rootReceiverAddress,
  xrpERC20Precompile,
} from './config'
import { getDecodedIdToken, getSignatureFromCustodialSigner } from './helpers'

export async function signMessage(
  message: string,
  callbackUrl?: string,
  onEncodedPayload?: (data: any) => void,
) {
  const decodedIdToken = getDecodedIdToken()

  if (decodedIdToken.payload.custodian !== 'fv') {
    throw new Error('not a custodial account')
  }
  const eoa = decodedIdToken.payload.eoa

  const signature = await getSignatureFromCustodialSigner(
    'sign-msg',
    eoa,
    message,
    identityProviderUri,
    callbackUrl,
    onEncodedPayload,
  )
  return signature
}

export async function signEthTransaction(
  fromAccount: string,
  to: string = ethReceiverAddress,
  amount: string = '0.0001',
  callbackUrl?: string,
  onEncodedPayload?: (data: object) => void,
) {
  if (getDecodedIdToken().payload.custodian !== 'fv') {
    throw new Error('not a custodial account')
  }

  // Fetch the current nonce
  const nonce = await providers.eth.getTransactionCount(fromAccount)
  const sendAmount = ethers.parseEther(amount).toString()

  const gasLimit = await providers.eth.estimateGas({
    to: ethReceiverAddress,
    value: sendAmount,
  })

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await providers.eth.getFeeData()

  // EIP1559 Transaction
  const rawTransactionWithoutSignature = {
    to: to,
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

  const signatureResponse = await getSignatureFromCustodialSigner(
    'sign-tx',
    fromAccount,
    serializedUnsignedTransaction,
    identityProviderUri,
    callbackUrl,
    onEncodedPayload,
  )

  if (!signatureResponse.success) {
    return signatureResponse
  }
  const signature = signatureResponse.data

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    from: fromAccount,
    signature,
  }

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature,
  ).serialized

  return {
    success: true,
    data: {
      serializedSignedTransaction,
      signature,
    },
  }
}

export async function signRootTransaction(
  fromAccount: string,
  to: string = rootReceiverAddress,
  amount: string = '1',
  callbackUrl?: string,
  onEncodedPayload?: (data: object) => void,
) {
  if (getDecodedIdToken().payload.custodian !== 'fv') {
    throw new Error('not a custodial account')
  }
  const nonce = await providers.root.getTransactionCount(fromAccount)

  const sendAmount = amount
  const gasLimit = await providers.root.estimateGas({
    to: XRP_PRECOMPILE_ADDRESS,
    data: xrpERC20Precompile.interface.encodeFunctionData('transfer', [
      to,
      sendAmount,
    ]),
  })

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await providers.root.getFeeData()

  const rawTransactionWithoutSignature = {
    to: XRP_PRECOMPILE_ADDRESS,
    data: xrpERC20Precompile.interface.encodeFunctionData('transfer', [
      to,
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

  const signatureResponse = await getSignatureFromCustodialSigner(
    'sign-tx',
    fromAccount,
    serializedUnsignedTransaction,
    identityProviderUri,
    callbackUrl,
    onEncodedPayload,
  )

  if (!signatureResponse.success) {
    return signatureResponse
  }
  const signature = signatureResponse.data

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    from: fromAccount,
    signature,
  }

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature,
  ).serialized

  return {
    success: true,
    data: {
      serializedSignedTransaction,
      signature,
    },
  }
}

export async function sendTransaction(serializedSignedTransaction: string) {
  const chainId = Transaction.from(serializedSignedTransaction).chainId

  let transactionType: 'eth' | 'root'
  if (chainId.toString() === ethChainId.toString()) {
    transactionType = 'eth'
  } else {
    transactionType = 'root'
  }

  const transactionResponse = await providers[
    transactionType
  ].broadcastTransaction(serializedSignedTransaction)

  return await transactionResponse.wait()
}
