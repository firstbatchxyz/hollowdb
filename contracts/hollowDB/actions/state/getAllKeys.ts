import type {HollowDBContractFunction} from '../../types';

export type HollowDBGetKeys = {
  function: 'getAllKeys';
  data: {};
};
export const getAllKeys: HollowDBContractFunction<HollowDBGetKeys> = async (state, action) => {
  return {
    result: await SmartWeave.kv.keys(),
  };
};
