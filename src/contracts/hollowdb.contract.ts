import {CantEvolveError, InvalidFunctionError, KeyExistsError} from './errors';
import {apply, onlyNonNullValue, onlyOwner, onlyProofVerified, onlyWhitelisted} from './modifiers';
import type {ContractHandle} from './types';
import {hashToGroup} from './utils';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update']};
type Value = unknown;

export const handle: ContractHandle<Value, Mode> = async (state, action) => {
  const {caller, input} = action;
  switch (input.function) {
    case 'get': {
      const {key} = await apply(caller, input.value, state);
      return {result: (await SmartWeave.kv.get(key)) as Value | null};
    }

    case 'getKeys': {
      const {options} = await apply(caller, input.value, state);
      return {result: await SmartWeave.kv.keys(options)};
    }

    case 'getKVMap': {
      const {options} = await apply(caller, input.value, state);
      return {result: await SmartWeave.kv.kvMap(options)};
    }

    case 'put': {
      const {key, value} = await apply(caller, input.value, state, onlyNonNullValue, onlyWhitelisted('put'));
      if ((await SmartWeave.kv.get(key)) !== null) {
        throw KeyExistsError;
      }
      await SmartWeave.kv.put(key, value);
      return {state};
    }

    case 'update': {
      const {key, value} = await apply(
        caller,
        input.value,
        state,
        onlyNonNullValue,
        onlyWhitelisted('update'),
        onlyProofVerified('auth', async (_, input) => {
          const oldValue = await SmartWeave.kv.get(input.key);
          return [hashToGroup(oldValue), hashToGroup(input.value), BigInt(input.key)];
        })
      );
      await SmartWeave.kv.put(key, value);
      return {state};
    }

    case 'remove': {
      const {key} = await apply(
        caller,
        input.value,
        state,
        onlyWhitelisted('update'),
        onlyProofVerified('auth', async (_, input) => {
          const oldValue = await SmartWeave.kv.get(input.key);
          return [hashToGroup(oldValue), BigInt(0), BigInt(input.key)];
        })
      );
      await SmartWeave.kv.del(key);
      return {state};
    }

    case 'updateOwner': {
      const {newOwner} = await apply(caller, input.value, state, onlyOwner);
      state.owner = newOwner;
      return {state};
    }

    case 'updateProofRequirement': {
      const {name, value} = await apply(caller, input.value, state, onlyOwner);
      state.isProofRequired[name] = value;
      return {state};
    }

    case 'updateVerificationKey': {
      const {name, verificationKey} = await apply(caller, input.value, state, onlyOwner);
      state.verificationKeys[name] = verificationKey;
      return {state};
    }

    case 'updateWhitelistRequirement': {
      const {name, value} = await apply(caller, input.value, state, onlyOwner);
      state.isWhitelistRequired[name] = value;
      return {state};
    }

    case 'updateWhitelist': {
      const {add, remove, name} = await apply(caller, input.value, state, onlyOwner);
      add.forEach(user => {
        state.whitelists[name][user] = true;
      });
      remove.forEach(user => {
        delete state.whitelists[name][user];
      });
      return {state};
    }

    case 'evolve': {
      const srcTxId = await apply(caller, input.value, state, onlyOwner);
      if (!state.canEvolve) {
        throw CantEvolveError;
      }
      state.evolve = srcTxId;
      return {state};
    }

    default:
      // type-safe way to make sure all switch cases are handled
      input satisfies never;
      throw InvalidFunctionError;
  }
};
