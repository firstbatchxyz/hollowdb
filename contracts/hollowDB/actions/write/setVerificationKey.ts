import errors from '../../errors';
import type {HollowDBContractFunction} from '../../types';

export const setVerificationKey: HollowDBContractFunction = async (state, action) => {
  const {verificationKey} = action.input.data;

  if (action.caller !== state.creator) {
    throw errors.NotCreatorError(action.input.function);
  }

  state.verificationKey = verificationKey;

  return {state};
};
