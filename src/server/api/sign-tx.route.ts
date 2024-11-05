import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import {
  getLoggedInEoa,
  ethChainId,
  rootChainId,
  signEthTransaction,
  signRootTransaction,
  SERVER_PORT,
} from 'shared'

export const handleSignTx = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  const { query } = parseUrl(req.url!, true)
  const to = query.to
  const chainId = query.chainId
  const amount = query.amount
  if (!to || !chainId || !amount) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Bad Request' }))
    return
  }
  const from = getLoggedInEoa()
  if (!from) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Unauthorized, please login.' }))
    return
  }

  if (chainId != rootChainId && chainId != ethChainId) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid chainId' }))
    return
  }

  let signRes:
    | Awaited<ReturnType<typeof signRootTransaction>>
    | Awaited<ReturnType<typeof signEthTransaction>>
  if (chainId === rootChainId) {
    signRes = await signRootTransaction(from, to.toString(), amount.toString())
  } else {
    signRes = await signEthTransaction(from, to.toString(), amount.toString())
  }

  if (!signRes.success) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        message: 'Failed to sign transaction',
        data: {
          to,
          chainId,
          error: signRes.data,
        },
      }),
    )
    return
  }

  const sendTransactionUrl = `http://localhost:${SERVER_PORT}/send-tx?serializedSignedTransaction=${signRes.data.serializedSignedTransaction}`

  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      message: 'Transaction signed',
      data: {
        from,
        to,
        chainId,
        serializedSignedTransaction: signRes.data.serializedSignedTransaction,
        sendTransactionUrl,
      },
    }),
  )
}
