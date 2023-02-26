import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';
import {verifyProof, valueTxToBigInt} from '../../../../common/utilities';

export const remove: HollowDBContractFunction = async (state, action) => {
  const {key, proof} = action.input.data;

  const dbValueTx = await SmartWeave.kv.get<string>(key);
  if (dbValueTx === null) {
    throw errors.KeyNotExistsError;
  }

  if (await verifyProof(proof, [valueTxToBigInt(dbValueTx), BigInt(key)], state.verificationKey)) {
    await SmartWeave.kv.put(key, null);
  } else {
    throw errors.InvalidProofError(action.input.function);
  }

  return {state};
};
