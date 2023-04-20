import {HollowDBGet} from '../actions/crud/get';
import {HollowDBPut} from '../actions/crud/put';
import {HollowDBRemove} from '../actions/crud/remove';
import {HollowDBUpdate} from '../actions/crud/update';
import {HollowDBGetKeys} from '../actions/state/getAllKeys';
import {HollowDBUpdateState} from '../actions/state/updateState';
import {HollowDBUpdateWhitelist} from '../actions/state/updateWhitelist';
import {HollowDBEvolve} from '../actions/evolve';

/**
 * Union of all HollowDB input types
 */
export type HollowDBInput =
  // crud
  | HollowDBGet
  | HollowDBRemove
  | HollowDBPut
  | HollowDBUpdate
  // state
  | HollowDBGetKeys
  | HollowDBUpdateState
  | HollowDBUpdateWhitelist
  // evolve
  | HollowDBEvolve;

/**
 * HollowDB contract state.
 */
export interface HollowDBState {
  verificationKey: object;
  owner: string;
  isProofRequired: boolean;
  isWhitelistRequired: {
    put: boolean;
    update: boolean;
  };
  canEvolve: boolean;
  evolve?: string; // evolve is not required to be present initially
  whitelist: {
    put: {
      [address: string]: boolean;
    };
    update: {
      [address: string]: boolean;
    };
  };
}

/**
 * A contract action, that is a caller and their input.
 */
export type HollowDBAction<InputType> = {
  input: InputType;
  caller: string;
};

/**
 * A result from a read request.
 */
export type HollowDBResult =
  | string[] // a list of keys
  | string // an existing value
  | null; // non-existing value

/**
 * A generic HollowDB contract function. Functions can specify their
 * input type via the generic type parameter
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HollowDBContractFunction<InputType = any> = (
  state: HollowDBState,
  action: HollowDBAction<InputType>
) => Promise<{state: HollowDBState} | {result: HollowDBResult}>;
