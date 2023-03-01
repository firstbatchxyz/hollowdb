import errors from '../../errors';
import type {HollowDBContractFunction, HollowDBState} from '../../types';

export type HollowDBUpdateState = {
  function: 'updateState';
  data: {
    // omit whitelist from this object because we update in a different way
    newState: Partial<Omit<HollowDBState, 'whitelist'>>;
  };
};
export const updateState: HollowDBContractFunction<HollowDBUpdateState> = async (state, action) => {
  const {newState} = action.input.data;

  // caller must be owner
  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  return {
    state: {
      ...state,
      ...newState,
    },
  };
};
