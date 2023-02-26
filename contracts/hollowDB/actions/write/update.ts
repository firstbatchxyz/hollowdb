import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {verifyProof, valueTxToBigInt} from '../../../../common/utilities';

export const update: HollowDBContractFunction = async (state, action) => {
  const {key, valueTx, proof} = action.input.data;

  const dbValueTx = await SmartWeave.kv.get<string>(key);
  if (dbValueTx === null) {
    throw errors.KeyNotExistsError;
  }

  if (await verifyProof(proof, [valueTxToBigInt(dbValueTx), BigInt(key)], state.verificationKey)) {
    await SmartWeave.kv.put(key, valueTx);
  } else {
    throw errors.InvalidProofError(action.input.function);
  }

  return {state};
};
