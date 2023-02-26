import type {HollowDBContractFunction} from '../../types';

export const get: HollowDBContractFunction = async (state, action) => {
  const {key} = action.input.data;

  return {
    result: await SmartWeave.kv.get<string>(key),
  };
};
