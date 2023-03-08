import {HollowDBGet} from '../actions/read/get';
import {HollowDBPut} from '../actions/write/put';
import {HollowDBRemove} from '../actions/write/remove';
import {HollowDBUpdate} from '../actions/write/update';
import {HollowDBUpdateState} from '../actions/write/updateState';
import {HollowDBUpdateWhitelist} from '../actions/write/updateWhitelist';

/**
 * Union of all HollowDB input types
 */
export type HollowDBInput =
  | HollowDBGet
  | HollowDBRemove
  | HollowDBPut
  | HollowDBUpdate
  | HollowDBUpdateState
  | HollowDBUpdateWhitelist;

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
  evolve: any; // TODO: check type
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
 * A result from a read request can be a value at the given key, that is a string or null if none exists.
 */
export type HollowDBResult = string | null;

/**
 * A generic HollowDB contract function. Functions can specify their
 * input type via the generic type parameter
 */
export type HollowDBContractFunction<InputType = any> = (
  state: HollowDBState,
  action: HollowDBAction<InputType>
) => Promise<{state: HollowDBState} | {result: HollowDBResult}>;
