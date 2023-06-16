import {errors} from '../errors';
import type {ContractFunction} from '../types/contract';
import type {
  EvolveInput,
  GetKVMapInput,
  GetKeysInput,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
} from '../types/inputs';
import {assertOwner} from '../utils';

export const evolve: ContractFunction<EvolveInput> = async (state, action) => {
  const srcTxId = action.input.value;

  assertOwner(state, action);

  if (!state.canEvolve) {
    throw errors.CantEvolveError;
  }
  state.evolve = srcTxId;

  return {state};
};

export const getKeys: ContractFunction<GetKeysInput> = async (_, action) => {
  const {options} = action.input.data;

  return {
    result: await SmartWeave.kv.keys(options),
  };
};

export const getKVMap: ContractFunction<GetKVMapInput> = async (_, action) => {
  const {options} = action.input.data;

  return {
    result: await SmartWeave.kv.kvMap(options),
  };
};

export const updateOwner: ContractFunction<UpdateOwnerInput> = async (state, action) => {
  const {newOwner} = action.input.data;
  assertOwner(state, action);

  state.owner = newOwner;

  return {state};
};

export const updateRequirement: ContractFunction<UpdateRequirementInput> = async (state, action) => {
  const {name, type, value} = action.input.data;
  assertOwner(state, action);

  if (type === 'proof') {
    state.isProofRequired[name] = value;
  } else if (type === 'whitelist') {
    state.isWhitelistRequired[name] = value;
  }

  return {state};
};

export const updateVerificationKey: ContractFunction<UpdateVerificationKeyInput> = async (state, action) => {
  const {name, verificationKey} = action.input.data;
  assertOwner(state, action);

  state.verificationKeys[name] = verificationKey;

  return {state};
};

export const updateWhitelist: ContractFunction<UpdateWhitelistInput> = async (state, action) => {
  const {add, remove, name} = action.input.data;
  assertOwner(state, action);

  add.forEach(user => {
    state.whitelists[name][user] = true;
  });
  remove.forEach(user => {
    delete state.whitelists[name][user];
  });

  return {state};
};
