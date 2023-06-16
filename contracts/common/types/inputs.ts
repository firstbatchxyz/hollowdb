import type {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';

export type GetInput = {
  function: 'get';
  data: {
    key: string;
  };
};

export type PutInput = {
  function: 'put';
  data: {
    key: string;
    value: unknown;
  };
};

export type RemoveInput = {
  function: 'remove';
  data: {
    key: string;
    proof: object;
  };
};

export type UpdateInput = {
  function: 'update';
  data: {
    key: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    proof: object;
  };
};

export type GetKeysInput = {
  function: 'getKeys';
  data: {
    options?: SortKeyCacheRangeOptions;
  };
};

export type GetKVMapInput = {
  function: 'getKVMap';
  data: {
    options?: SortKeyCacheRangeOptions;
  };
};

export type UpdateRequirementInput = {
  function: 'updateRequirement';
  data: {
    type: 'whitelist' | 'proof';
    name: string;
    value: boolean;
  };
};

export type UpdateOwnerInput = {
  function: 'updateOwner';
  data: {
    newOwner: string;
  };
};

export type UpdateVerificationKeyInput = {
  function: 'updateVerificationKey';
  data: {
    verificationKey: object;
    name: string;
  };
};

export type UpdateWhitelistInput = {
  function: 'updateWhitelist';
  data: {
    add: string[];
    remove: string[];
    name: string;
  };
};

export type EvolveInput = {
  function: 'evolve';
  value: string; // this naming is important!
};
