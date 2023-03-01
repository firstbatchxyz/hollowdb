import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export type HollowDBPut = {
  function: 'put';
  data: {
    key: string;
    valueTx: string;
  };
};
export const put: HollowDBContractFunction<HollowDBPut> = async (state, action) => {
  const {key, valueTx} = action.input.data;

  // caller must be owner
  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  // caller must be whitelisted
  if (state.isWhitelistRequired && !state.whitelist[action.caller]) {
    throw errors.NotWhitelistedError(action.input.function);
  }

  // must be an empty value
  if ((await SmartWeave.kv.get<string>(key)) !== null) {
    throw errors.KeyExistsError;
  }

  await SmartWeave.kv.put(key, valueTx);

  return {state};
};
