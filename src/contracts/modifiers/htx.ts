import {ExpectedProofError, InvalidProofError} from '../errors';
import {ContractState} from '../types';
import {verifyProof} from '../utils';

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
