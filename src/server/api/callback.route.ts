import { IncomingMessage, ServerResponse } from 'http'
import {
  processCallback,
  ethChainId,
  ethReceiverAddress,
  rootChainId,
  rootReceiverAddress,
  SERVER_PORT,
} from 'shared'

export const handleCallback = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  const data = await processCallback(req.url!.split('?')[1])

  const from = data.decodedIdToken.payload.eoa
  const signRootTransactionUrl = `http://localhost:${SERVER_PORT}/sign-tx?from=${from}&to=${rootReceiverAddress}&chainId=${rootChainId}&amount=1`
  const signEthTransactionUrl = `http://localhost:${SERVER_PORT}/sign-tx?from=${from}&to=${ethReceiverAddress}&chainId=${ethChainId}&amount=0.0001`
  const signMessageUrl = `http://localhost:${SERVER_PORT}/sign-msg?from=${from}&message=0x65Aa45B043f360887fD0fA18A4E137e036F5A708`

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      message: 'Successfully Logged In',
      eoa: from,
      sign: {
        signMessageUrl,
        signRootTransactionUrl,
        signEthTransactionUrl,
      },
    }),
  )
}
