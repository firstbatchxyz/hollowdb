export interface HollowDBState {
  verificationKey: object;
  creator: string;
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
    creator: string;
  };
}

export type HollowDBFunctionSelector = 'put' | 'update' | 'remove' | 'get' | 'setVerificationKey' | 'setCreator';

export type HollowDBResult =
  | string
  | null
  | {
      verificationKey: object;
    };

export type HollowDBContractResult = {state: HollowDBState} | {result: HollowDBResult};

export type HollowDBContractFunction = (
  state: HollowDBState,
  action: HollowDBAction
) => Promise<HollowDBContractResult>;
