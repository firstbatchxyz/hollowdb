import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export type HollowDBEvolve = {
  function: 'evolve';
  value: string;
};
export const evolve: HollowDBContractFunction<HollowDBEvolve> = async (state, action) => {
  // caller must be owner
  if (action.caller !== state.owner) {
    throw errors.NotOwnerError(action.input.function);
  }

  // evolving must be enabled
  if (!state.canEvolve) {
    throw errors.CantEvolveError;
  }

  state.evolve = action.input.value;

  return {state};
};
