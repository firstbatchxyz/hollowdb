import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export const setCreator: HollowDBContractFunction = async (state, action) => {
  const {creator} = action.input.data;

  if (action.caller !== state.creator) {
    throw errors.NotCreatorError(action.input.function);
  }

  state.creator = creator;

  return {state};
};
