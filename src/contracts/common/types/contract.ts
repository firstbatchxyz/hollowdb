/* eslint-disable @typescript-eslint/no-explicit-any */
/** A generic contract input. */
export type ContractInput = {function: string; value: any};

/** A contract action, that is a caller and their input. */
export type ContractAction<Input extends ContractInput = ContractInput> = {
  input: Input;
  caller: string;
};

/** A contract state. */
export type ContractState<Mode extends {whitelists: string[]; circuits: string[]} = {whitelists: []; circuits: []}> = {
  canEvolve: boolean;
  evolve?: string;
  owner: string;
  // proofs mode
  isProofRequired: {[name in Mode['circuits'] extends [] ? string : Mode['circuits'][number]]: boolean};
  verificationKeys: {[name in Mode['circuits'] extends [] ? string : Mode['circuits'][number]]: any};
  // whitelists mode
  whitelists: {
    [name in Mode['whitelists'] extends [] ? string : Mode['whitelists'][number]]: {[address: string]: boolean};
  };
  isWhitelistRequired: {[name in Mode['whitelists'] extends [] ? string : Mode['whitelists'][number]]: boolean};
};

/** A contract handler, that is the entry point to a SmartWeave contract. */
export type ContractHandle<State extends ContractState, Input extends ContractInput> = (
  state: State,
  action: ContractAction<Input>
) =>
  | Promise<{
      // read interaction returns a result
      result: unknown;
    }>
  | Promise<{
      // write interaction returns new state
      state: State;
    }>;
