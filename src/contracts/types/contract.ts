import {
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
export type ContractInput<V = any, M extends ContractMode = {whitelists: []; circuits: []}> =
  | GetKVMapInput
  | GetKeysInput
  | GetInput
  | PutInput<V>
  | UpdateInput<V>
  | RemoveInput
  | UpdateOwnerInput
  | UpdateWhitelistInput<M['whitelists']>
  | UpdateVerificationKeyInput<M['circuits']>
  | UpdateRequirementInput<M['whitelists'], M['circuits']>
  | EvolveInput;

/**
 * A type for whitelists and circuits used within a contract.
 */
export type ContractMode = {whitelists: string[]; circuits: string[]};

/** A contract action, that is a caller and input.
 * @template I input type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContractAction<I extends {function: string; value: any}> = {
  input: I;
  caller: string;
};

/**
 * A contract state.
 *
 * For example, HollowDB state is defined as:
 *
 * ```ts
 * ContractState<{circuits: ['auth']; whitelists: ['put', 'update']}>
 * ```
 *
 * because we have an `auth` circuit, and we have two whitelists names `put` and `update`.
 *
 * @template M a type where whitelists and circuit names are specified. If none, pass in empty array `[]` to each.
 */
export type ContractState<M extends ContractMode = {whitelists: []; circuits: []}> = {
  canEvolve: boolean;
  evolve?: string;
  owner: string;
  // proofs mode
  isProofRequired: {[name in M['circuits'] extends [] ? string : M['circuits'][number]]: boolean};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verificationKeys: {[name in M['circuits'] extends [] ? string : M['circuits'][number]]: any};
  // whitelists mode
  whitelists: {
    [name in M['whitelists'] extends [] ? string : M['whitelists'][number]]: {[address: string]: boolean};
  };
  isWhitelistRequired: {[name in M['whitelists'] extends [] ? string : M['whitelists'][number]]: boolean};
};

/** A contract handler, that is the entry point to a SmartWeave contract.
 * @template V type of values in the database
 * @template M contract mode, that is whitelist names and circuit names (for verification keys)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContractHandle<V = any, M extends ContractMode = {whitelists: []; circuits: []}> = (
  state: ContractState<M>,
  action: ContractAction<ContractInput<V, M>>
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
