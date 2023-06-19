import type {ContractState, GetInput, PutInput, RemoveInput, UpdateInput} from '../types';
import {KeyExistsError} from '../errors';
import {assertWhitelist, safeGet, verifyAuthProof} from '../utils';

export async function get<State extends ContractState>(_: State, {key}: GetInput['value']) {
  return {
    result: await SmartWeave.kv.get(key),
  };
}

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
