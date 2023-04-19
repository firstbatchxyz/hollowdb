import errors from '../../errors';
import type {HollowDBContractFunction, HollowDBState} from '../../types';

export type HollowDBUpdateWhitelist = {
  function: 'updateWhitelist';
  data: {
    whitelist: {
      add: string[];
      remove: string[];
    };
    type: keyof HollowDBState['whitelist'];
  };
};
export const updateWhitelist: HollowDBContractFunction<HollowDBUpdateWhitelist> = async (state, action) => {
  const {whitelist, type} = action.input.data;

  // caller must be owner
  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  // add users
  whitelist.add.forEach(user => {
    state.whitelist[type][user] = true;
  });

  // remove users
  whitelist.remove.forEach(user => {
    delete state.whitelist[type][user];
  });

  return {state};
};
