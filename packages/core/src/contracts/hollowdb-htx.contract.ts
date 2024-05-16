import {CantEvolveError, ExpectedProofError, InvalidFunctionError, InvalidProofError, KeyExistsError} from './errors';
import {apply, onlyOwner, onlyWhitelisted, onlyNonNullValue, onlyNonNullValues} from './modifiers';
import {verifyProof} from './utils';
import type {ContractHandle, ContractState} from './types';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update']};
type Value = `${string}.${string}`;

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

    case 'getMany': {
      const {keys} = await apply(caller, input.value, state);
      const values = (await Promise.all(keys.map(key => SmartWeave.kv.get(key)))) as (Value | null)[];
      return {result: values};
    }

    case 'put': {
      const {key, value} = await apply(caller, input.value, state, onlyNonNullValue, onlyWhitelisted('put'));
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
        onlyProofVerifiedHTX('auth')
      );
      await SmartWeave.kv.put(key, value);
      return {state};
    }

    case 'remove': {
      const {key} = await apply(caller, input.value, state, onlyWhitelisted('update'), onlyProofVerifiedHTX('auth'));
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

/**
 * A modifier specific to HTX contract, where values are in form `hash.txid` and txId represents
 * a Bundlr upload transaction id.
 */
export function onlyProofVerifiedHTX(circuit: string) {
  return async <I extends {key: string; value?: `${string}.${string}`; proof?: object}, S extends ContractState>(
    _: string,
    input: I,
    state: S
  ) => {
    // must have proofs enabled for this circuit
    if (!state.isProofRequired[circuit]) {
      return input;
    }
    // must have a proof object
    if (!input.proof) {
      throw ExpectedProofError;
    }

    // get old value to provide the public signal for proof verification
    const oldValue = (await SmartWeave.kv.get(input.key)) as `${string}.${string}`;
    const [oldHash] = oldValue.split('.');
    const [newHash] = input.value ? input.value.split('.') : [0];

    // verify proof
    const ok = await verifyProof(
      input.proof,
      [BigInt(oldHash), BigInt(newHash), BigInt(input.key)],
      state.verificationKeys[circuit]
    );
    if (!ok) {
      throw InvalidProofError;
    }

    return input;
  };
}
