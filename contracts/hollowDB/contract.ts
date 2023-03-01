// reads
import {get} from './actions/read/get.js';
// writes
import {put} from './actions/write/put.js';
import {update} from './actions/write/update.js';
import {remove} from './actions/write/remove.js';
import {setOwner} from './actions/write/setOwner.js';
import {setVerificationKey} from './actions/write/setVerificationKey.js';
// types & constants
import type {HollowDBContractFunction} from './types/index.js';
import errors from './errors/index.js';

export const handle: HollowDBContractFunction = (state, action) => {
  switch (action.input.function) {
    case 'put':
      return put(state, action);
    case 'update':
      return update(state, action);
    case 'remove':
      return remove(state, action);
    case 'get':
      return get(state, action);
    case 'setVerificationKey':
      return setVerificationKey(state, action);
    case 'setOwner':
      return setOwner(state, action);
    default:
      throw errors.UnknownFunctionError(action.input.function);
  }
};
