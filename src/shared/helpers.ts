import {
  browserRedirectUri,
  custodialSignerUrl,
  serverRedirectUri,
} from './config'
import { SignMessage, SignMessageError } from './types'
import * as E from 'fp-ts/Either'
import { v4 as uuidV4 } from 'uuid'
import { parse as parseUrl } from 'url'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { openURL } from 'openURL'

/* HELPERS */

export function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function generateCodeVerifierAndChallenge() {
  const codeVerifier = generateRandomString(128)
  const buffer = new TextEncoder().encode(codeVerifier)
  const hashed = await sha256(buffer)
  const codeChallenge = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(hashed)),
  )
  return { codeVerifier, codeChallenge }
}

export function sha256(buffer: ArrayBuffer) {
  return crypto.subtle.digest('SHA-256', buffer)
}

export function base64UrlEncode(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function parseJwt(token: string) {
  const [header, payload, signature] = token.split('.')

  if (!header || !payload) {
    throw new Error('Invalid JWT token')
  }

  const decodedHeader = JSON.parse(base64UrlDecode(header))
  const decodedPayload = JSON.parse(base64UrlDecode(payload))

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature,
  }
}

export function base64UrlDecode(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = str + padding
  return atob(base64)
}

export function getEnvironment() {
  if (typeof window !== 'undefined') {
    return 'browser'
  }
  return 'server'
}

export let localStorage: Storage

if (typeof window === 'undefined') {
  const { LocalStorage } = require('node-localstorage')
  localStorage = new LocalStorage('./storage')
} else {
  localStorage = window.localStorage
}

export const redirectUri =
  getEnvironment() === 'browser' ? browserRedirectUri : serverRedirectUri

export function getDecodedIdToken() {
  const decodedIdToken = localStorage.getItem('decoded_id_token')
  if (!decodedIdToken) {
    return null
  }
  return JSON.parse(decodedIdToken)
}

export function getLoggedInEoa() {
  const decodedIdToken = getDecodedIdToken()
  if (!decodedIdToken) {
    return null
  }
  return decodedIdToken.payload.eoa
}

export function generateCustodialSignerUrl(
  type: 'sign-tx' | 'sign-msg',
  fromAccount: string,
  data: string,
  idpUrl: string,
  callbackUrl?: string,
) {
  let signPayload = {}
  switch (type) {
    case 'sign-msg':
      signPayload = {
        account: fromAccount,
        message: data,
        idpUrl,
        callbackUrl,
      }
      break
    case 'sign-tx':
      signPayload = {
        account: fromAccount,
        transaction: data,
        idpUrl,
        callbackUrl,
      }
      break
  }

  const id = `client:${uuidV4()}`
  const tag = `fv/${type}`

  const encodedPayload = {
    id,
    tag,
    payload: signPayload,
  }

  const signerUrl =
    custodialSignerUrl +
    '?request=' +
    base64UrlEncode(JSON.stringify(encodedPayload))

  return {
    signerUrl,
    encodedPayload,
  }
}

export function getSignatureFromBrowser(
  type: 'sign-tx' | 'sign-msg',
  fromAccount: string,
  digest: string,
  idpUrl: string,
  callbackUrl?: string,
  onEncodedPayload?: (data: any) => void,
): Promise<{ success: true; data: string } | { success: false; data: string }> {
  const { signerUrl, encodedPayload } = generateCustodialSignerUrl(
    type,
    fromAccount,
    digest,
    idpUrl,
    callbackUrl,
  )

  onEncodedPayload?.(encodedPayload)

  openURL(
    signerUrl,
    'popup',
    'futureverse_wallet',
    'popup,right=0,width=290,height=480,menubar=no,toolbar=no,location=no,status=0',
  )

  return new Promise((resolve, reject) => {
    window.addEventListener('message', (ev: MessageEvent<unknown>) => {
      if (ev.origin === custodialSignerUrl) {
        const dataR = SignMessage.decode(ev.data)
        if (E.isRight(dataR)) {
          return resolve({
            success: true,
            data: dataR.right.payload.response.signature,
          })
        }

        const errorDataR = SignMessageError.decode(ev.data)

        if (E.isRight(errorDataR)) {
          return resolve({
            success: false,
            data: errorDataR.right.payload.error.error.code,
          })
        }
      }
    })
  })
}

export function getSignatureFromServer(
  type: 'sign-tx' | 'sign-msg',
  fromAccount: string,
  digest: string,
  idpUrl: string,
  callbackUrl?: string,
  onEncodedPayload?: (data: any) => void,
): Promise<{ success: true; data: string } | { success: false; data: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    const signatureCallbackHandler = (
      req: IncomingMessage,
      res: ServerResponse,
    ): void => {
      if (!req.url?.startsWith('/signature-callback')) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Not Found' }))
        return
      }

      const { query } = parseUrl(req.url!, true)
      const signerResponse = query.response
      if (!signerResponse) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Error received')
        server.close()
        reject({
          success: false,
          data: 'Does not received signature',
        })
        return
      }

      const decodedResponse = JSON.parse(
        base64UrlDecode(signerResponse.toString()),
      )
      const error = decodedResponse.result.data.error
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Error received')
        server.close()
        reject({
          success: false,
          data: error,
        })
        return
      }

      const signature = decodedResponse.result.data.signature
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Signature received, you can close this window')
      server.close()
      resolve({
        success: true,
        data: signature,
      })
    }

    server.listen(0, () => {
      const port = (server.address() as any).port
      const { signerUrl, encodedPayload } = generateCustodialSignerUrl(
        type,
        fromAccount,
        digest,
        idpUrl,
        `http://localhost:${port}/signature-callback`,
      )

      onEncodedPayload?.(encodedPayload)

      openURL(signerUrl, 'redirect')

      server.on('request', signatureCallbackHandler)
    })

    server.on('error', (err) => {
      console.error('Server error:', err)
      reject({
        success: false,
        data: 'Server error',
      })
    })

    setTimeout(() => {
      server.close()
      reject({
        success: false,
        data: 'Timeout',
      })
    }, 60000)
  })
}

export async function getSignatureFromCustodialSigner(
  type: 'sign-tx' | 'sign-msg',
  fromAccount: string,
  digest: string,
  idpUrl: string,
  callbackUrl?: string,
  onEncodedPayload?: (data: any) => void,
) {
  const env = getEnvironment()
  switch (env) {
    case 'server':
      return getSignatureFromServer(
        type,
        fromAccount,
        digest,
        idpUrl,
        callbackUrl,
        onEncodedPayload,
      )
    case 'browser':
      return getSignatureFromBrowser(
        type,
        fromAccount,
        digest,
        idpUrl,
        callbackUrl,
        onEncodedPayload,
      )
  }
}

export { openURL } from 'openURL'
