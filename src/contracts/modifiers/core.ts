import {ExpectedProofError, InvalidProofError, NotOwnerError, NotWhitelistedError, NullValueError} from '../errors';
import {ContractState} from '../types';
import {verifyProof} from '../utils';

/** Ensures `caller` to be the contract owner. */
export const onlyOwner = <I, S extends ContractState>(caller: string, input: I, state: S) => {
  if (caller !== state.owner) {
    throw NotOwnerError;
  }
  return input;
};

/**
 * Ensures `input.value` is not `null`.
 *
 * This is required mainly because SortKeyCache can not differentiate between a non-existing
 * key that returns `null` when queried, or a key that stores `null`. This case causes an
 * ambiguity regarding whether a key exists or not.
 */
export const onlyNonNullValue = <I extends {value: unknown}>(_: string, input: I) => {
  if (input.value === null) {
    throw NullValueError;
  }
  return input;
};

/** Returns a modifier that ensures `caller` is whitelisted for `list`. */
export const onlyWhitelisted = <I, S extends ContractState>(list: keyof S['whitelists']) => {
  return (caller: string, input: I, state: S) => {
    // must have whitelisting enabled for this list
    if (!state.isWhitelistRequired[list as string]) {
      return input;
    }

    // must be whitelisted
    if (!state.whitelists[list as string][caller]) {
      throw NotWhitelistedError;
    }
    return input;
  };
};

/** Returns a modifier that ensures input has a proof . */
export const onlyProofVerified = <I extends {key: string; value?: unknown; proof?: object}, S extends ContractState>(
  proofName: keyof S['isProofRequired'],
  prepareInputs: (caller: string, input: I, state: S) => Promise<bigint[]> | bigint[]
) => {
  return async (caller: string, input: I, state: S) => {
    // must have proofs enabled for this circuit
    if (!state.isProofRequired[proofName as string]) {
      return input;
    }

    // must have a proof object
    if (!input.proof) {
      throw ExpectedProofError;
    }

    // verify proof
    const ok = await verifyProof(
      input.proof,
      await prepareInputs(caller, input, state),
      state.verificationKeys[proofName as string]
    );
    if (!ok) {
      throw InvalidProofError;
    }

    return input;
  };
};
