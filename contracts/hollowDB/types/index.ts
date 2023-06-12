import type {HollowDBGet} from '../actions/crud/get';
import type {HollowDBPut} from '../actions/crud/put';
import type {HollowDBRemove} from '../actions/crud/remove';
import type {HollowDBUpdate} from '../actions/crud/update';
import type {HollowDBGetKeys} from '../actions/state/getKeys';
import type {HollowDBUpdateState} from '../actions/state/updateState';
import type {HollowDBUpdateWhitelist} from '../actions/state/updateWhitelist';
import type {HollowDBEvolve} from '../actions/evolve';
import type {HollowDBGetKVMap} from '../actions/state/getKVMap';

/** Union of all HollowDB input types. */
export type HollowDBInput =
  // crud
  | HollowDBGet
  | HollowDBRemove
  | HollowDBPut
  | HollowDBUpdate
  // state
  | HollowDBGetKeys
  | HollowDBGetKVMap
  | HollowDBUpdateState
  | HollowDBUpdateWhitelist
  // evolve
  | HollowDBEvolve;

/** HollowDB contract state. */
export interface HollowDBState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verificationKey: any;
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

/** A contract action, that is a caller and their input. */
export type HollowDBAction<InputType> = {
  input: InputType;
  caller: string;
};

/** Protocol used in SnarkJS, can also be retrieved from `verificationKey.protocol`. */
export type ProofSystem = 'groth16' | 'plonk';

/** A result from a read request. */
export type HollowDBResult = unknown;

/**
 * A generic HollowDB contract function. Functions can specify their
 * input type via the generic type parameter
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HollowDBContractFunction<InputType = any> = (
  state: HollowDBState,
  action: HollowDBAction<InputType>
) => Promise<{state: HollowDBState} | {result: HollowDBResult}>;
