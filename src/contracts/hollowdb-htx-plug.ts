import {CantEvolveError, InvalidFunctionError, KeyExistsError} from './errors';
import {apply, onlyOwner, onlyWhitelisted} from './modifiers';
import type {
  ContractState,
  EvolveInput,
  GetInput,
  GetKVMapInput,
  GetKeysInput,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
  ContractAction,
} from './types';
import {onlyProofVerifiedHTX} from './modifiers/htx';
import {PutHTXInput, RemoveHTXInput, UpdateHTXInput} from './types/htx';

export type HollowHTXState = ContractState<{circuits: ['auth']; whitelists: ['put', 'update']}>;
export type HollowHTXInput =
  | GetInput
  | PutHTXInput
  | RemoveHTXInput
  | UpdateHTXInput
  | GetKeysInput
  | GetKVMapInput
  | UpdateOwnerInput
  | UpdateWhitelistInput
  | UpdateVerificationKeyInput
  | EvolveInput
  | UpdateRequirementInput;

export async function handle(state: ContractState, action: ContractAction<HollowHTXInput>) {
  const {caller, input} = action;
  switch (input.function) {
    case 'get': {
      const {key} = await apply(caller, input.value, state);
      return {
        result: await SmartWeave.kv.get(key),
      };
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
      const {key, value} = await apply(caller, input.value, state, onlyWhitelisted('put'));
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

    case 'updateRequirement': {
      const {name, type, value} = await apply(caller, input.value, state, onlyOwner);
      if (type === 'proof') {
        state.isProofRequired[name] = value;
      } else if (type === 'whitelist') {
        state.isWhitelistRequired[name] = value;
      }
      return {state};
    }

    case 'updateVerificationKey': {
      const {name, verificationKey} = await apply(caller, input.value, state, onlyOwner);
      state.verificationKeys[name] = verificationKey;
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
      throw InvalidFunctionError;
  }
}
