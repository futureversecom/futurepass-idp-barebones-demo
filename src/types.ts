import * as t from 'io-ts'

export const SignMessage = t.strict({
  id: t.string,
  tag: t.string,
  payload: t.strict({
    response: t.strict({
      signature: t.string,
    }),
    tag: t.string,
  }),
})

export type SignMessage = t.TypeOf<typeof SignMessage>

export const SignMessageError = t.strict({
  id: t.string,
  tag: t.string,
  payload: t.strict({
    error: t.strict({
      error: t.strict({
        code: t.string,
      }),
      tag: t.string,
    }),
    tag: t.string,
  }),
})

export type SignMessageError = t.TypeOf<typeof SignMessageError>

export type DecodedIdToken = {
  payload: any
  header?: any
  signature?: string
}
