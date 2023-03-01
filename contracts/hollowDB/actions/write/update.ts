import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {verifyProof, valueTxToBigInt} from '../../../../common/utilities';

export type HollowDBUpdate = {
  function: 'update';
  data: {
    key: string;
    proof: object;
    valueTx: string;
  };
};
export const update: HollowDBContractFunction<HollowDBUpdate> = async (state, action) => {
  const {key, valueTx, proof} = action.input.data;

  // there must be a value at the key
  const dbValueTx = await SmartWeave.kv.get<string>(key);
  if (dbValueTx === null) {
    throw errors.KeyNotExistsError;
  }

  // if required, the proof must verify
  if (
    !state.isProofRequired ||
    (await verifyProof(
      proof,
      [valueTxToBigInt(dbValueTx), valueTxToBigInt(valueTx), BigInt(key)],
      state.verificationKey
    ))
  ) {
    await SmartWeave.kv.put(key, valueTx);
  } else {
    throw errors.InvalidProofError(action.input.function);
  }

  return {state};
};
