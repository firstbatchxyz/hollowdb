import {
  get,
  evolve,
  getKeys,
  getKVMap,
  updateOwner,
  updateWhitelist,
  updateVerificationKey,
  updateRequirement,
} from './functions';
import {InvalidFunctionError} from './errors';
import type {
  ContractState,
  ContractHandle,
  EvolveInput,
  GetInput,
  GetKVMapInput,
  GetKeysInput,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
} from './types';
import {PutHTXInput, RemoveHTXInput, UpdateHTXInput} from './types/htx';
import {putHTX, removeHTX, updateHTX} from './functions/htx';

export type HollowState = ContractState<{circuits: ['auth']; whitelists: ['put', 'update']}>;
export type HollowInput =
  | GetInput
  | PutHTXInput
  | GetKeysInput
  | GetKVMapInput
  | UpdateOwnerInput
  | UpdateWhitelistInput
  | UpdateVerificationKeyInput
  | EvolveInput
  | RemoveHTXInput
  | UpdateHTXInput
  | UpdateRequirementInput;

export const handle: ContractHandle<HollowState, HollowInput> = (state, action) => {
  const {caller, input} = action;
  switch (input.function) {
    case 'get':
      return get(state, input.value);
    case 'getKeys':
      return getKeys(state, input.value);
    case 'getKVMap':
      return getKVMap(state, input.value);
    case 'put':
      return putHTX(state, input.value, caller);
    case 'update':
      return updateHTX(state, input.value, caller);
    case 'remove':
      return removeHTX(state, input.value, caller);
    case 'updateOwner':
      return updateOwner(state, input.value, caller);
    case 'updateRequirement':
      return updateRequirement(state, input.value, caller);
    case 'updateVerificationKey':
      return updateVerificationKey(state, input.value, caller);
    case 'updateWhitelist':
      return updateWhitelist(state, input.value, caller);
    case 'evolve':
      return evolve(state, input.value, caller);
    default:
      throw InvalidFunctionError;
  }
};
