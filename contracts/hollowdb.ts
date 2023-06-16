import {get, put, update, remove} from './common/functions/crud.js';
import {
  evolve,
  getKeys,
  getKVMap,
  updateOwner,
  updateWhitelist,
  updateVerificationKey,
  updateRequirement,
} from './common/functions/state.js';
import {errors} from './common/errors/index.js';
import type {ContractFunction, ContractInput} from './common/types/contract.js';

export const handle: ContractFunction<ContractInput> = (state, action) => {
  const input = action.input;
  switch (input.function) {
    case 'get':
      return get(state, {caller: action.caller, input});
    case 'getKeys':
      return getKeys(state, {caller: action.caller, input});
    case 'getKVMap':
      return getKVMap(state, {caller: action.caller, input});
    case 'put':
      return put(state, {caller: action.caller, input});
    case 'update':
      return update(state, {caller: action.caller, input});
    case 'remove':
      return remove(state, {caller: action.caller, input});
    case 'updateOwner':
      return updateOwner(state, {caller: action.caller, input});
    case 'updateRequirement':
      return updateRequirement(state, {caller: action.caller, input});
    case 'updateVerificationKey':
      return updateVerificationKey(state, {caller: action.caller, input});
    case 'updateWhitelist':
      return updateWhitelist(state, {caller: action.caller, input});
    case 'evolve':
      return evolve(state, {caller: action.caller, input});
    default:
      throw errors.UnknownFunctionError(action.input.function);
  }
};
