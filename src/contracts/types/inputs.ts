import type {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';
import {OpitonalArray} from '.';

export type GetInput = {
  function: 'get';
  value: {
    key: string;
  };
};

export type PutInput<V> = {
  function: 'put';
  value: {
    key: string;
    value: V;
  };
};

export type UpdateInput<V> = {
  function: 'update';
  value: {
    key: string;
    value: V;
    proof?: object;
  };
};

export type RemoveInput = {
  function: 'remove';
  value: {
    key: string;
    proof?: object;
  };
};

export type GetKeysInput = {
  function: 'getKeys';
  value: {
    options?: SortKeyCacheRangeOptions;
  };
};

export type GetKVMapInput = {
  function: 'getKVMap';
  value: {
    options?: SortKeyCacheRangeOptions;
  };
};

export type UpdateWhitelistRequirementInput<N extends string[]> = {
  function: 'updateWhitelistRequirement';
  value: {
    name: OpitonalArray<N, string>;
    value: boolean;
  };
};

export type UpdateProofRequirementInput<N extends string[]> = {
  function: 'updateProofRequirement';
  value: {
    name: OpitonalArray<N, string>;
    value: boolean;
  };
};

export type UpdateOwnerInput = {
  function: 'updateOwner';
  value: {
    newOwner: string;
  };
};

export type UpdateVerificationKeyInput<N extends string[]> = {
  function: 'updateVerificationKey';
  value: {
    verificationKey: object;
    name: OpitonalArray<N, string>;
  };
};

export type UpdateWhitelistInput<N extends string[]> = {
  function: 'updateWhitelist';
  value: {
    add: string[];
    remove: string[];
    name: OpitonalArray<N, string>;
  };
};

export type EvolveInput = {
  function: 'evolve';
  // NOTE: it is important that this is named `value`
  value: string;
};
