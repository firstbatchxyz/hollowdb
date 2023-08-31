import {OpitonalArray} from '.';
import {
  EvolveInput,
  GetInput,
  GetKVMapInput,
  GetKeysInput,
  PutInput,
  RemoveInput,
  UpdateInput,
  UpdateOwnerInput,
  UpdateProofRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistRequirementInput,
  UpdateWhitelistInput,
} from './inputs';

/**
 * A prepared HollowDB contract input. It is a union of all basic operations,
 * and PUT & UPDATE is type-safed with a generic parameter, defaults to `any`.
 *
 * You may extend this type by adding more Input types in union.
 *
 * @template V value type
 * @template M contract mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContractInput<V = any, M extends ContractMode = ContractMode> =
  | GetKVMapInput
  | GetKeysInput
  | GetInput
  | PutInput<V>
  | UpdateInput<V>
  | RemoveInput
  | UpdateOwnerInput
  | UpdateWhitelistInput<M['whitelists']>
  | UpdateWhitelistRequirementInput<M['whitelists']>
  | UpdateVerificationKeyInput<M['proofs']>
  | UpdateProofRequirementInput<M['proofs']>
  | EvolveInput;

/**
 * A type to describe whitelists and proofs (circuits) used within a contract.
 */
export type ContractMode = {whitelists: string[]; proofs: string[]};

/**
 * A generic contract input.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContractInputGeneric = {function: string; value: any};

/** A contract action, that is a caller and input.
 * @template I input type
 */

export type ContractAction<I extends ContractInputGeneric> = {
  input: I;
  caller: string;
};

/**
 * A contract state. For example, HollowDB state is defined as:
 *
 * ```ts
 * ContractState<{circuits: ['auth']; whitelists: ['put', 'update']}>
 * ```
 *
 * because we have an `auth` circuit, and we have two whitelists names `put` and `update`.
 *
 * @template M a type where whitelists and circuit names are specified. If none, pass in empty array `[]` to each.
 */
export type ContractState<M extends ContractMode = ContractMode> = {
  canEvolve: boolean;
  evolve?: string;
  owner: string;
  // proofs mode
  isProofRequired: {[name in OpitonalArray<M['proofs'], string>]: boolean};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verificationKeys: {[name in OpitonalArray<M['proofs'], string>]: any};
  // whitelists mode
  whitelists: {
    [name in OpitonalArray<M['whitelists'], string>]: {[address: string]: boolean};
  };
  isWhitelistRequired: {[name in OpitonalArray<M['whitelists'], string>]: boolean};
};

/** A contract handler, that is the entry point to a SmartWeave contract.
 * @template V type of values in the database
 * @template M contract mode, that is whitelist names and circuit names (for verification keys)
 * @template I custom inputs, in the form `{function, value}`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContractHandle<V = any, M extends ContractMode = ContractMode, I extends ContractInputGeneric = never> = (
  state: ContractState<M>,
  action: ContractAction<ContractInput<V, M> | I>
) => Promise<
  | {
      // read interaction returns a result
      result:
        | null // no value exists
        | V // value exists
        | string[] // for `getKeys`
        | Map<string, V>; // for `getKVMap`
    }
  | {
      // write interaction returns new state
      state: typeof state;
    }
>;
