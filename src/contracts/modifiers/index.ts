import {ExpectedProofError, InvalidProofError, NotOwnerError, NotWhitelistedError} from '../errors';
import {ContractState} from '../types';
import {hashToGroup, verifyProof} from '../utils';

export async function apply<I, S extends ContractState>(
  caller: string,
  input: I,
  state: S,
  ...modifiers: ((caller: string, input: I, state: S) => I | Promise<I>)[]
): Promise<typeof input> {
  for (const modifier of modifiers) {
    input = await modifier(caller, input, state);
  }
  return input;
}

export const onlyOwner = <I, S extends ContractState>(caller: string, input: I, state: S) => {
  if (caller !== state.owner) {
    throw NotOwnerError;
  }
  return input;
};

export function onlyWhitelisted(list: string) {
  return <I, S extends ContractState>(caller: string, input: I, state: S) => {
    // must have whitelisting enabled for this list
    if (!state.isWhitelistRequired[list]) {
      return input;
    }

    // must be whitelisted
    if (!state.whitelists[list][caller]) {
      throw NotWhitelistedError;
    }
    return input;
  };
}

export function onlyProofVerified(circuit: string) {
  return async <I extends {key: string; value?: unknown; proof?: object}, S extends ContractState>(
    _: string,
    input: I,
    state: S
  ) => {
    // must have proofs enabled for this circuit
    if (!state.isProofRequired[circuit]) {
      return input;
    }

    // must have a proof object
    if (!input.proof) {
      throw ExpectedProofError;
    }

    // get old value to provide the public signal for proof verification
    const oldValue = await SmartWeave.kv.get(input.key);

    // verify proof
    const ok = await verifyProof(
      input.proof,
      [hashToGroup(oldValue), hashToGroup(input.value), BigInt(input.key)],
      state.verificationKeys.auth
    );
    if (!ok) {
      throw InvalidProofError;
    }

    return input;
  };
}
