import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {verifyProof, valueTxToBigInt} from '../../../../common/utilities';

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
  const dbValueTx = await SmartWeave.kv.get<string>(key);
  if (dbValueTx === null) {
    throw errors.KeyNotExistsError;
  }

  // if required, the proof must verify
  if (
    !state.isProofRequired ||
    (await verifyProof(proof, [valueTxToBigInt(dbValueTx), 0n, BigInt(key)], state.verificationKey))
  ) {
    await SmartWeave.kv.put(key, null);
  } else {
    throw errors.InvalidProofError(action.input.function);
  }

  return {state};
};
