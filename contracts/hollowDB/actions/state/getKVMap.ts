import {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';
import type {HollowDBContractFunction} from '../../types';

export type HollowDBGetKVMap = {
  function: 'getKVMap';
  data: {
    options?: SortKeyCacheRangeOptions;
  };
};
export const getKVMap: HollowDBContractFunction<HollowDBGetKVMap> = async (state, action) => {
  const {options} = action.input.data;

  return {
    result: await SmartWeave.kv.kvMap(options),
  };
};
