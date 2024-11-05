import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import { ethChainId, rootChainId, sendTransaction } from 'shared'
import { Transaction } from 'ethers'

export const handleSendTx = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  const { query } = parseUrl(req.url!, true)
  const serializedSignedTransaction =
    query.serializedSignedTransaction?.toString()
  if (!serializedSignedTransaction) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Bad Request' }))
    return
  }

  const chainId = Transaction.from(
    serializedSignedTransaction,
  ).chainId.toString()

  if (!chainId) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Bad Request' }))
    return
  }

  if (chainId != rootChainId && chainId != ethChainId) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid chainId' }))
    return
  }

  const txResponse = await sendTransaction(serializedSignedTransaction)

  if (!txResponse) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        message: 'Failed to send transaction',
        data: {
          serializedSignedTransaction,
        },
      }),
    )
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      message: 'Transaction sent',
      data: {
        serializedSignedTransaction,
        txResponse,
      },
    }),
  )
}
