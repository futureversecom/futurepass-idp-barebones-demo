import { createServer, IncomingMessage, ServerResponse } from 'http'
import { SERVER_PORT, localStorage } from 'shared'
import {
  handleLogin,
  handleSignTx,
  handleCallback,
  handleSignMsg,
  handleSendTx,
} from './api'

const requestHandler = (req: IncomingMessage, res: ServerResponse): void => {
  try {
    const { url, method } = req
    if (!url) {
      throw new Error('No URL')
    }

    if (url === '/login' && method === 'GET') {
      handleLogin(req, res)
    } else if (url?.startsWith('/callback') && method === 'GET') {
      handleCallback(req, res)
    } else if (url?.startsWith('/sign-tx') && method === 'GET') {
      handleSignTx(req, res)
    } else if (url?.startsWith('/sign-msg') && method === 'GET') {
      handleSignMsg(req, res)
    } else if (url?.startsWith('/send-tx') && method === 'GET') {
      handleSendTx(req, res)
    } else {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Not Found' }))
    }
  } catch (e) {
    console.log(e)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: JSON.stringify(e) }))
  }
}

// Create the server
const server = createServer(requestHandler)

server.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`)
})

process.on('uncaughtException', (err) => {
  localStorage.clear()
  console.log(err)
  process.exit(1)
})
