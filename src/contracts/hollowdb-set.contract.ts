import {CantEvolveError, InvalidFunctionError, KeyExistsError} from './errors';
import {apply, onlyNonNullValue, onlyNonNullValues, onlyOwner, onlyProofVerified, onlyWhitelisted} from './modifiers';
import type {ContractHandle, ContractState} from './types';
import {hashToGroup} from './utils';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update', 'set']};
type Value = unknown;

export type SetInput<V> = {
  function: 'set';
  value: {
    key: string;
    value: V;
  };
};

export type SetManyInput<V> = {
  function: 'setMany';
  value: {
    keys: string[];
    values: V[];
  };
};

export type SetStateInput = {
  function: 'setState';
  value: ContractState<Mode>;
};

export const handle: ContractHandle<Value, Mode, SetInput<Value> | SetManyInput<Value> | SetStateInput> = async (
  state,
  action
) => {
  const {caller, input} = action;
  switch (input.function) {
    case 'get': {
      const {key} = await apply(caller, input.value, state);
      return {result: (await SmartWeave.kv.get(key)) as Value | null};
    }

    case 'getMany': {
      const {keys} = await apply(caller, input.value, state);
      const values = (await Promise.all(keys.map(key => SmartWeave.kv.get(key)))) as (Value | null)[];
      return {result: values};
    }

    case 'set': {
      const {key, value} = await apply(caller, input.value, state, onlyWhitelisted('set'), onlyNonNullValue);
      await SmartWeave.kv.put(key, value);
      return {state};
    }

    case 'setMany': {
      const {keys, values} = await apply(caller, input.value, state, onlyWhitelisted('set'), onlyNonNullValues);
      if (keys.length !== values.length) {
        throw new ContractError('Key and value counts mismatch');
      }
      await Promise.all(keys.map((key, i) => SmartWeave.kv.put(key, values[i])));
      return {state};
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
      const {key, value} = await apply(caller, input.value, state, onlyWhitelisted('put'), onlyNonNullValue);
      if ((await SmartWeave.kv.get(key)) !== null) {
        throw KeyExistsError;
      }
      await SmartWeave.kv.put(key, value);
      return {state};
    }

    case 'putMany': {
      const {keys, values} = await apply(caller, input.value, state, onlyWhitelisted('put'), onlyNonNullValues);
      if (keys.length !== values.length) {
        throw new ContractError('Key and value counts mismatch');
      }

      if (await Promise.all(keys.map(key => SmartWeave.kv.get(key))).then(values => values.some(val => val !== null))) {
        throw KeyExistsError;
      }
      await Promise.all(keys.map((key, i) => SmartWeave.kv.put(key, values[i])));
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

    case 'setState': {
      const newState = await apply(caller, input.value, state, onlyOwner);
      state = newState;
      return {state};
    }

    default:
      // type-safe way to make sure all switch cases are handled
      input satisfies never;
      throw InvalidFunctionError;
  }
};
