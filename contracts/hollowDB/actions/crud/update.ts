import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {verifyProof, valueToBigInt} from '../../utils';

export type HollowDBUpdate = {
  function: 'update';
  data: {
    key: string;
    proof: object;
    value: unknown;
  };
};
export const update: HollowDBContractFunction<HollowDBUpdate> = async (state, action) => {
  const {key, value, proof} = action.input.data;

  // caller must be whitelisted
  if (state.isWhitelistRequired.update && !state.whitelist.update[action.caller]) {
    throw errors.NotWhitelistedError(action.input.function);
  }

  // there must be a value at the key
  const dbValue = await SmartWeave.kv.get(key);
  if (dbValue === null) {
    throw errors.KeyNotExistsError;
  }

  // if required, the proof must verify
  if (state.isProofRequired) {
    const publicSignals: [curValueHash: bigint, nextValueHash: bigint, key: bigint] = [
      valueToBigInt(dbValue),
      valueToBigInt(value),
      BigInt(key),
    ];
    if (!(await verifyProof(proof, publicSignals, state.verificationKey))) {
      throw errors.InvalidProofError(action.input.function);
    }
  }

  await SmartWeave.kv.put(key, value);

  return {state};
};
