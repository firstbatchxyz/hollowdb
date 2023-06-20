import {
  get,
  put,
  update,
  remove,
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
  PutInput,
  RemoveInput,
  UpdateInput,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
} from './types';

export type HollowState = ContractState<{circuits: ['auth']; whitelists: ['put', 'update']}>;
export type HollowInput =
  | GetInput
  | PutInput
  | GetKeysInput
  | GetKVMapInput
  | UpdateOwnerInput
  | UpdateWhitelistInput
  | UpdateVerificationKeyInput
  | EvolveInput
  | RemoveInput
  | UpdateInput
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
      return put(state, input.value, caller);
    case 'update':
      return update(state, input.value, caller);
    case 'remove':
      return remove(state, input.value, caller);
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
