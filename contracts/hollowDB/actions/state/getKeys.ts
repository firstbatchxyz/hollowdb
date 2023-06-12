import {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';
import type {HollowDBContractFunction} from '../../types';

export type HollowDBGetKeys = {
  function: 'getKeys';
  data: {
    options?: SortKeyCacheRangeOptions;
  };
};
export const getAllKeys: HollowDBContractFunction<HollowDBGetKeys> = async (state, action) => {
  const {options} = action.input.data;

  return {
    result: await SmartWeave.kv.keys(options),
  };
};
