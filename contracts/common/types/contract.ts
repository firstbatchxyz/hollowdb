import type {
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

/** A contract input, targeted towards a specific function. */
export type ContractInput =
  | GetInput
  | PutInput
  | GetKeysInput
  | GetKVMapInput
  | UpdateOwnerInput
  | UpdateWhitelistInput
  | UpdateVerificationKeyInput
  | EvolveInput
  | RemoveInput
  | UpdateInput
  | UpdateRequirementInput;

/** A contract action, that is a caller and their input. */
export type ContractAction<Input extends ContractInput> = {
  input: Input;
  caller: string;
};

/** A contract state. */
export type ContractState = {
  canEvolve: boolean;
  evolve?: string;
  owner: string;
  // proofs mode
  isProofRequired: {[name: string]: boolean};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verificationKeys: {[name: string]: any};
  // whitelists mode
  whitelists: {[name: string]: {[address: string]: boolean}};
  isWhitelistRequired: {[name: string]: boolean};
};

/** A contract function that handles a specific function. */
export type ContractFunction<Input extends ContractInput> = (
  state: ContractState,
  action: ContractAction<Input>
) => Promise<{state: ContractState} | {result: ContractResult}>;

// TODO: maybe use something else here, or a generic?
/** A result from a read request. */
export type ContractResult = unknown;
