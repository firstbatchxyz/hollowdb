import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export const put: HollowDBContractFunction = async (state, action) => {
  const {key, valueTx} = action.input.data;

  if (action.caller !== state.creator) {
    throw errors.NotCreatorError(action.input.function);
  }

  if ((await SmartWeave.kv.get<string>(key)) !== null) {
    throw errors.KeyExistsError;
  }

  await SmartWeave.kv.put(key, valueTx);

  return {state};
};
