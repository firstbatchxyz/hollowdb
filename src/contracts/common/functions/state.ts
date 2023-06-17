import {CantEvolveError} from '../errors';
import {assertOwner} from '../utils';
import type {ContractState} from '../types/contract';
import type {
  EvolveInput,
  GetKVMapInput,
  GetKeysInput,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
} from '../types/inputs';

export async function evolve<State extends ContractState>(state: State, srcTxId: EvolveInput['value'], caller: string) {
  assertOwner(state, caller);

  if (!state.canEvolve) {
    throw CantEvolveError;
  }
  state.evolve = srcTxId;

  return {state};
}

export async function getKeys<State extends ContractState>(_: State, {options}: GetKeysInput['value']) {
  return {
    result: await SmartWeave.kv.keys(options),
  };
}

export async function getKVMap<State extends ContractState>(_: State, {options}: GetKVMapInput['value']) {
  return {
    result: await SmartWeave.kv.kvMap(options),
  };
}

export async function updateOwner<State extends ContractState>(
  state: State,
  {newOwner}: UpdateOwnerInput['value'],
  caller: string
) {
  assertOwner(state, caller);

  state.owner = newOwner;

  return {state};
}

// TODO: can be made typesafe for `name`?
export async function updateRequirement<State extends ContractState>(
  state: State,
  {name, type, value}: UpdateRequirementInput['value'],
  caller: string
) {
  assertOwner(state, caller);

  if (type === 'proof') {
    state.isProofRequired[name] = value;
  } else if (type === 'whitelist') {
    state.isWhitelistRequired[name] = value;
  }

  return {state};
}

export async function updateVerificationKey<State extends ContractState>(
  state: State,
  {name, verificationKey}: UpdateVerificationKeyInput['value'],
  caller: string
) {
  assertOwner(state, caller);

  state.verificationKeys[name] = verificationKey;

  return {state};
}

export async function updateWhitelist<State extends ContractState>(
  state: State,
  {add, remove, name}: UpdateWhitelistInput['value'],
  caller: string
) {
  assertOwner(state, caller);

  add.forEach(user => {
    state.whitelists[name][user] = true;
  });
  remove.forEach(user => {
    delete state.whitelists[name][user];
  });

  return {state};
}
