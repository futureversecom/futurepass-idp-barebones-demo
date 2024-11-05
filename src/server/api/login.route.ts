import { IncomingMessage, ServerResponse } from 'http'
import { login } from 'shared'

export const handleLogin = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  await login('idp-f')

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      message: 'Login Initiated, Continue login with newly opened window.',
    }),
  )
}
