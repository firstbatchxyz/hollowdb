import {readFileSync} from 'fs';
import {Prover, computeKey} from '../src';
import constants from './constants';
const snarkjs = require('snarkjs');

const preimage = BigInt(1122334455);
const curValue = {
  lorem: 'ipsum',
  foo: 123,
  bar: true,
};
const newValue = {
  lorem: 'dolor',
  foo: 987,
  bar: false,
};

describe('hollow-authz circuit', () => {
  let prover: Prover;
  let verificationKey: object;
  let proof: object;
  let correctKey: string;
  let correctCurValueHash: string;
  let correctNewValueHash: string;

  beforeAll(async () => {
    // prepare prover and verification key
    prover = new Prover(constants.WASM_PATH, constants.PROVERKEY_PATH);
    verificationKey = JSON.parse(readFileSync(constants.VERIFICATIONKEY_PATH).toString());

    // generate a proof
    const fullProof = await prover.generateProof(preimage, curValue, newValue);
    proof = fullProof.proof;
    correctCurValueHash = fullProof.publicSignals[0];
    correctNewValueHash = fullProof.publicSignals[1];
    correctKey = fullProof.publicSignals[2];

    // computeKey should find the same result
    expect(correctKey).toEqual(computeKey(preimage));
  });

  it('should verify proof', async () => {
    const result = await snarkjs.groth16.verify(
      verificationKey,
      [correctCurValueHash, correctNewValueHash, correctKey],
      proof
    );
    expect(result).toEqual(true);
  });

  it('should NOT verify proof with wrong current value', async () => {
    const result = await snarkjs.groth16.verify(verificationKey, ['12345', correctNewValueHash, correctKey], proof);
    expect(result).toEqual(false);
  });

  it('should NOT verify proof with wrong new value', async () => {
    const result = await snarkjs.groth16.verify(verificationKey, [correctCurValueHash, '12345', correctKey], proof);
    expect(result).toEqual(false);
  });

  it('should NOT verify proof with wrong key', async () => {
    const result = await snarkjs.groth16.verify(
      verificationKey,
      [correctCurValueHash, correctNewValueHash, '12345'],
      proof
    );
    expect(result).toEqual(false);
  });
});
