import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export type HollowDBPut = {
  function: 'put';
  data: {
    key: string;
    value: unknown;
  };
};
export const put: HollowDBContractFunction<HollowDBPut> = async (state, action) => {
  const {key, value} = action.input.data;

  // caller must be whitelisted
  if (state.isWhitelistRequired.put && !state.whitelist.put[action.caller]) {
    throw errors.NotWhitelistedError(action.input.function);
  }

  // must be an empty value
  if ((await SmartWeave.kv.get(key)) !== null) {
    throw errors.KeyExistsError;
  }

  await SmartWeave.kv.put(key, value);

  return {state};
};
