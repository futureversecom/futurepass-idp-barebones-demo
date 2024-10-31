import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import { getLoggedInEoa, signMessage } from 'shared'

export const handleSignMsg = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  const { query } = parseUrl(req.url!, true)

  const message = query.message
  if (!message) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Bad Request' }))
    return
  }
  const loggedInEoa = getLoggedInEoa()
  if (!loggedInEoa) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Unauthorized, please login.' }))
    return
  }

  const from = query.from
  if (
    !from ||
    from.toString().toLowerCase() !== loggedInEoa.toString().toLowerCase()
  ) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Bad Request' }))
    return
  }

  const signature = await signMessage(message.toString())

  if (!signature.success) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        message: 'Failed to sign message',
        data: {
          from,
          message,
          error: signature.data,
        },
      }),
    )
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      message: 'Message signed',
      data: {
        from,
        message,
        signature: signature.data,
      },
    }),
  )
}
