import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export type HollowDBUpdateWhitelist = {
  function: 'updateWhitelist';
  data: {
    whitelist: {
      add: string[];
      remove: string[];
    };
  };
};
export const updateWhitelist: HollowDBContractFunction<HollowDBUpdateWhitelist> = async (state, action) => {
  const {whitelist} = action.input.data;

  // caller must be owner
  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  // add users
  whitelist.add.forEach(user => {
    state.whitelist[user] = true;
  });

  // remove users
  whitelist.add.forEach(user => {
    delete state.whitelist[user];
  });

  return {state};
};
