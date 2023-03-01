import type {HollowDBContractFunction} from '../../types';

export type HollowDBGet = {
  function: 'get';
  data: {
    key: string;
  };
};
export const get: HollowDBContractFunction<HollowDBGet> = async (state, action) => {
  const {key} = action.input.data;

  return {
    result: await SmartWeave.kv.get<string>(key),
  };
};
