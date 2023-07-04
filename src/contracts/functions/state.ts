import {CantEvolveError} from '../errors';
import {assertOwner} from '../utils';
import type {
  ContractState,
  EvolveInput,
  GetKVMapInput,
  GetKeysInput,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
} from '../types';

/** Evolves the contract code with respect to provided the source transaction id. */
export async function evolve<State extends ContractState>(state: State, srcTxId: EvolveInput['value'], caller: string) {
  assertOwner(state, caller);

  if (!state.canEvolve) {
    throw CantEvolveError;
  }
  state.evolve = srcTxId;

  return {state};
}

/** Returns keys with respect to the provided range options. If no option is given, returns all keys. */
export async function getKeys<State extends ContractState>(_: State, {options}: GetKeysInput['value']) {
  return {
    result: await SmartWeave.kv.keys(options),
  };
}

/** Returns a mapping of keys to value, with respect to the provided range options. */
export async function getKVMap<State extends ContractState>(_: State, {options}: GetKVMapInput['value']) {
  return {
    result: await SmartWeave.kv.kvMap(options),
  };
}

/**
 * Update owner of the contract.
 *
 * The caller must be the contract owner.
 *
 * Note that this is potentially destructive, as if the owner
 * is wrongfully updated, and there is no access to the new owner, you won't be able to call
 * administrative functions in the contract.
 */
export async function updateOwner<State extends ContractState>(
  state: State,
  {newOwner}: UpdateOwnerInput['value'],
  caller: string
) {
  assertOwner(state, caller);

  state.owner = newOwner;

  return {state};
}

/**
 * Update proof or whitelist requirements.
 *
 * The caller must be the contract owner.
 *
 * For example, disabling the requirement for `put` whitelist will disable
 * the checks made for put operation.
 */
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

/**
 * Updates the verification key for some circuit.
 *
 * The caller must be the contract owner.
 */
export async function updateVerificationKey<State extends ContractState>(
  state: State,
  {name, verificationKey}: UpdateVerificationKeyInput['value'],
  caller: string
) {
  assertOwner(state, caller);

  state.verificationKeys[name] = verificationKey;

  return {state};
}

/**
 * Updates the whitelist for some list. In doing so, it will add or remove
 * the specified list of addresses.
 *
 * The caller must be the contract owner.
 */
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
