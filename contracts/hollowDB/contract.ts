import {get} from './actions/read/get.js';
import {put} from './actions/write/put.js';
import {update} from './actions/write/update.js';
import {remove} from './actions/write/remove.js';
import {evolve} from './actions/write/evolve.js';

import {updateState} from './actions/write/updateState.js';
import {updateWhitelist} from './actions/write/updateWhitelist.js';

import type {HollowDBContractFunction} from './types/index.js';
import errors from './errors/index.js';

export const handle: HollowDBContractFunction = (state, action) => {
  switch (action.input.function) {
    case 'get':
      return get(state, action);
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
