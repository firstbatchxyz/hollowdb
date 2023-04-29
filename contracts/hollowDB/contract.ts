// CRUD operations
import {get} from './actions/crud/get.js';
import {put} from './actions/crud/put.js';
import {update} from './actions/crud/update.js';
import {remove} from './actions/crud/remove.js';
// evolve functionality
import {evolve} from './actions/evolve.js';
// state updates
import {getAllKeys} from './actions/state/getAllKeys.js';
import {updateState} from './actions/state/updateState.js';
import {updateWhitelist} from './actions/state/updateWhitelist.js';
// others
import errors from './errors/index.js';
import type {HollowDBContractFunction} from './types/index.js';

export const handle: HollowDBContractFunction = (state, action) => {
  switch (action.input.function) {
    case 'get':
      return get(state, action);
    case 'getAllKeys':
      return getAllKeys(state, action);
    case 'put':
      return put(state, action);
    case 'update':
      return update(state, action);
    case 'remove':
      return remove(state, action);
    case 'updateState':
      return updateState(state, action);
    case 'updateWhitelist':
      return updateWhitelist(state, action);
    case 'evolve':
      return evolve(state, action);
    default:
      throw errors.UnknownFunctionError(action.input.function);
  }
};
