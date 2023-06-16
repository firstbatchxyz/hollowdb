import {errors} from '../errors';
import type {ContractFunction} from '../types/contract';
import type {GetInput, PutInput, RemoveInput, UpdateInput} from '../types/inputs';
import {assertWhitelist, safeGet, verifyAuthProof} from '../utils';

export const get: ContractFunction<GetInput> = async (_, action) => {
  const {key} = action.input.data;

  return {
    result: await SmartWeave.kv.get(key),
  };
};

export const put: ContractFunction<PutInput> = async (state, action) => {
  const {key, value} = action.input.data;
  assertWhitelist(state, action, 'put');

  // key must be empty
  if ((await SmartWeave.kv.get(key)) !== null) {
    throw errors.KeyExistsError;
  }
  await SmartWeave.kv.put(key, value);

  return {state};
};

export const remove: ContractFunction<RemoveInput> = async (state, action) => {
  const {key, proof} = action.input.data;
  assertWhitelist(state, action, 'update');

  const dbValue = await safeGet(key);
  await verifyAuthProof(state, action, proof, dbValue, null, key);
  await SmartWeave.kv.del(key);

  return {state};
};

export const update: ContractFunction<UpdateInput> = async (state, action) => {
  const {key, value, proof} = action.input.data;
  assertWhitelist(state, action, 'update');

  const dbValue = await safeGet(key);
  await verifyAuthProof(state, action, proof, dbValue, value, key);
  await SmartWeave.kv.put(key, value);

  return {state};
};
