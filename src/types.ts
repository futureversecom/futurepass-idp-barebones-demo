import { either as E } from 'fp-ts';
import * as t from 'io-ts';

export const signMessageType = t.strict({
  id: t.string,
  tag: t.string,
  payload: t.strict({
    response: t.strict({
      signature: t.string,
    }),
    tag: t.string,
  }),
});

export type signMessageType = t.TypeOf<typeof signMessageType>;
