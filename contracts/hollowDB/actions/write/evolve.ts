import errors from '../../errors';
import type {HollowDBContractFunction, HollowDBState} from '../../types';

export type HollowDBEvolve = {
  function: 'evolve';
  value: any;
};
export const evolve: HollowDBContractFunction<HollowDBEvolve> = async (state, action) => {
  // caller must be owner
  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  if (state.canEvolve) state.evolve = action.input.value;

  return {state};
};
