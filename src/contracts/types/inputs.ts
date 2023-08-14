import type {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';

export type GetInput = {
  function: 'get';
  value: {
    key: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PutInput<V = any> = {
  function: 'put';
  value: {
    key: string;
    value: V;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UpdateInput<V = any> = {
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

export type UpdateRequirementInput = {
  function: 'updateRequirement';
  value:
    | {
        type: 'whitelist';
        name: string; // keyof whitelist
        value: boolean;
      }
    | {
        type: 'proof';
        name: string; // keyof proof
        value: boolean;
      };
};

export type UpdateOwnerInput = {
  function: 'updateOwner';
  value: {
    newOwner: string;
  };
};

export type UpdateVerificationKeyInput = {
  function: 'updateVerificationKey';
  value: {
    verificationKey: object;
    name: string;
  };
};

export type UpdateWhitelistInput = {
  function: 'updateWhitelist';
  value: {
    add: string[];
    remove: string[];
    name: string;
  };
};

export type EvolveInput = {
  function: 'evolve';
  // NOTE: it is important that this is named `value`
  value: string;
};
