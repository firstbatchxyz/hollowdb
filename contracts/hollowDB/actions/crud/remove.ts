import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {valueToBigInt, verifyProof} from '../../utils';

export type HollowDBRemove = {
  function: 'remove';
  data: {
    key: string;
    proof: object;
  };
};
export const remove: HollowDBContractFunction<HollowDBRemove> = async (state, action) => {
  const {key, proof} = action.input.data;

  // caller must be whitelisted
  // note that we check the UPDATE whitelist, since REMOVE is equivalent to
  // UPDATE but with null as the next value
  if (state.isWhitelistRequired.update && !state.whitelist.update[action.caller]) {
    throw errors.NotWhitelistedError(action.input.function);
  }

  // there must be a value at the key
  const dbValue = await SmartWeave.kv.get(key);
  if (dbValue === null) {
    throw errors.KeyNotExistsError;
  }

  // if required, the proof must verify
  if (
    !state.isProofRequired ||
    (await verifyProof(proof, [valueToBigInt(dbValue), 0n, BigInt(key)], state.verificationKey))
  ) {
    // TODO: we are not using `del` yet, as it may not completely remove every key in the cache
    // there is `delete` function defined in SortKeyCache but it is not exported in KV yet.
    await SmartWeave.kv.put(key, null);
  } else {
    throw errors.InvalidProofError(action.input.function);
  }

  return {state};
};
