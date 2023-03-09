import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {verifyProof, valueToBigInt} from '../../../utils';

export type HollowDBUpdate = {
  function: 'update';
  data: {
    key: string;
    proof: object;
    value: string;
  };
};
export const update: HollowDBContractFunction<HollowDBUpdate> = async (state, action) => {
  const {key, value, proof} = action.input.data;

  // caller must be whitelisted
  if (state.isWhitelistRequired.update && !state.whitelist.update[action.caller]) {
    throw errors.NotWhitelistedError(action.input.function);
  }

  // there must be a value at the key
  const dbValue = await SmartWeave.kv.get<string>(key);
  if (dbValue === null) {
    throw errors.KeyNotExistsError;
  }

  // if required, the proof must verify
  if (
    !state.isProofRequired ||
    (await verifyProof(proof, [valueToBigInt(dbValue), valueToBigInt(value), BigInt(key)], state.verificationKey))
  ) {
    await SmartWeave.kv.put(key, value);
  } else {
    throw errors.InvalidProofError(action.input.function);
  }

  return {state};
};
