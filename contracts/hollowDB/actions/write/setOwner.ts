import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export const setOwner: HollowDBContractFunction = async (state, action) => {
  const {owner} = action.input.data;

  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  state.owner = owner;

  return {state};
};
