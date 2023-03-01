export interface HollowDBState {
  verificationKey: object;
  owner: string;
}

export interface HollowDBAction {
  input: HollowDBInput;
  caller: string;
}

export interface HollowDBInput {
  function: HollowDBFunctionSelector;
  data: {
    key: string;
    valueTx: string;
    proof: object;
    verificationKey: object;
    owner: string;
  };
}

/**
 * Defined functions in HollowDB
 */
export type HollowDBFunctionSelector = 'put' | 'update' | 'remove' | 'get' | 'setVerificationKey' | 'setOwner';

/**
 * A result from a read request can be a value at the given key, that is a string or null if none exists.
 */
export type HollowDBResult = string | null;

export type HollowDBContractFunction = (
  state: HollowDBState,
  action: HollowDBAction
) => Promise<{state: HollowDBState} | {result: HollowDBResult}>;
