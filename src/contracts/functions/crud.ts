import type {ContractState, GetInput, PutInput, RemoveInput, UpdateInput} from '../types';
import {KeyExistsError} from '../errors';
import {assertWhitelist, safeGet, verifyAuthProof} from '../utils';

/** Gets a value at the specified key. */
export async function get<State extends ContractState>(_: State, {key}: GetInput['value']) {
  return {
    result: await SmartWeave.kv.get(key),
  };
}

/**
 * Puts a value at the specified key.
 *
 * If required:
 * - `caller` must be whitelisted for `put`
 */
export async function put<State extends ContractState<{whitelists: ['put']; circuits: []}>>(
  state: State,
  {key, value}: PutInput['value'],
  caller: string
) {
  assertWhitelist(state, caller, 'put');

  if ((await SmartWeave.kv.get(key)) !== null) {
    throw KeyExistsError;
  }
  await SmartWeave.kv.put(key, value);

  return {state};
}

/**
 * Removes a value at the specified key.
 *
 * If required:
 * - `caller` must be whitelisted for `update`
 * - `caller` must present a ZKP that they know the preimage of the key, where the proof is bound
 * to hash of current value in database, and `0` for the next value.
 */
export async function remove<State extends ContractState<{whitelists: ['update']; circuits: ['auth']}>>(
  state: State,
  {key, proof}: RemoveInput['value'],
  caller: string
) {
  assertWhitelist(state, caller, 'update');

  const dbValue = await safeGet(key);
  await verifyAuthProof(state, proof, dbValue, null, key);
  await SmartWeave.kv.del(key);

  return {state};
}

/**
 * Updates a value at the specified key.
 *
 * If required:
 * - `caller` must be whitelisted for `update`
 * - `caller` must present a ZKP that they know the preimage of the key, where the proof is bound
 * to hash of current value as it appears in db, and hash of next value.
 */
export async function update<State extends ContractState<{whitelists: ['update']; circuits: ['auth']}>>(
  state: State,
  {key, value, proof}: UpdateInput['value'],
  caller: string
) {
  assertWhitelist(state, caller, 'update');

  const dbValue = await safeGet(key);
  await verifyAuthProof(state, proof, dbValue, value, key);
  await SmartWeave.kv.put(key, value);

  return {state};
}
