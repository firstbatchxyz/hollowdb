import type {ContractState} from '../types';
import {KeyExistsError} from '../errors';
import {assertWhitelist, safeGet, verifyAuthProofImmediate} from '../utils';
import {HTXValueType, PutHTXInput, RemoveHTXInput, UpdateHTXInput} from '../types/htx';

export async function putHTX<State extends ContractState<{whitelists: ['put']; circuits: []}>>(
  state: State,
  {key, value}: PutHTXInput['value'],
  caller: string
) {
  assertWhitelist(state, caller, 'put');

  if ((await SmartWeave.kv.get(key)) !== null) {
    throw KeyExistsError;
  }
  await SmartWeave.kv.put(key, value);

  return {state};
}

export async function removeHTX<State extends ContractState<{whitelists: ['update']; circuits: ['auth']}>>(
  state: State,
  {key, proof}: RemoveHTXInput['value'],
  caller: string
) {
  assertWhitelist(state, caller, 'update');

  const dbValue = await safeGet<HTXValueType>(key);
  const [oldHash] = dbValue.split('.');

  await verifyAuthProofImmediate(state, proof, BigInt(oldHash), BigInt(0), BigInt(key));
  await SmartWeave.kv.del(key);

  return {state};
}

export async function updateHTX<State extends ContractState<{whitelists: ['update']; circuits: ['auth']}>>(
  state: State,
  {key, value, proof}: UpdateHTXInput['value'],
  caller: string
) {
  assertWhitelist(state, caller, 'update');

  const dbValue = await safeGet<string>(key);
  const [oldHash] = dbValue.split('.');
  const [newHash] = value.split('.');

  await verifyAuthProofImmediate(state, proof, BigInt(oldHash), BigInt(newHash), BigInt(key));
  await SmartWeave.kv.put(key, value);

  return {state};
}
