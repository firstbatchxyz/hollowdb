import {readFileSync} from 'fs';
import {Prover} from './utils/prover';
import {computeKey} from './utils';
import constants from './constants';
import {decimalToHex} from './utils';
// const snarkjs = require('snarkjs');

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import * as snarkjs from 'snarkjs';

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

describe.each(['groth16', 'plonk'] as const)('circuits (%s)', proofSystem => {
  let prover: Prover;
  let verificationKey: object;
  let proof: object;
  let correctKey: string;
  let correctCurValueHash: string;
  let correctNewValueHash: string;

  beforeAll(async () => {
    // prepare prover and verification key

    if (proofSystem === 'groth16') {
      prover = new Prover(
        constants.PROVERS.groth16.HOLLOWDB.WASM_PATH,
        constants.PROVERS.groth16.HOLLOWDB.PROVERKEY_PATH,
        proofSystem
      );
      verificationKey = JSON.parse(readFileSync(constants.PROVERS.groth16.HOLLOWDB.VERIFICATIONKEY_PATH, 'utf-8'));
    } else {
      prover = new Prover(
        constants.PROVERS.plonk.HOLLOWDB.WASM_PATH,
        constants.PROVERS.plonk.HOLLOWDB.PROVERKEY_PATH,
        proofSystem
      );
      verificationKey = JSON.parse(readFileSync(constants.PROVERS.plonk.HOLLOWDB.VERIFICATIONKEY_PATH, 'utf-8'));
    }

    // generate a proof
    const fullProof = await prover.generateProof(preimage, curValue, newValue);
    proof = fullProof.proof;
    correctCurValueHash = fullProof.publicSignals[0];
    correctNewValueHash = fullProof.publicSignals[1];
    correctKey = decimalToHex(fullProof.publicSignals[2]);

    // computeKey should find the same result
    expect(correctKey).toEqual(computeKey(preimage));
  });

  it('should verify proof', async () => {
    const result = await snarkjs[proofSystem].verify(
      verificationKey,
      [correctCurValueHash, correctNewValueHash, correctKey],
      proof
    );
    expect(result).toEqual(true);
  });

  it('should NOT verify proof with wrong current value', async () => {
    const result = await snarkjs[proofSystem].verify(
      verificationKey,
      ['12345', correctNewValueHash, correctKey],
      proof
    );
    expect(result).toEqual(false);
  });

  it('should NOT verify proof with wrong new value', async () => {
    const result = await snarkjs[proofSystem].verify(
      verificationKey,
      [correctCurValueHash, '12345', correctKey],
      proof
    );
    expect(result).toEqual(false);
  });

  it('should NOT verify proof with wrong key', async () => {
    const result = await snarkjs[proofSystem].verify(
      verificationKey,
      [correctCurValueHash, correctNewValueHash, '12345'],
      proof
    );
    expect(result).toEqual(false);
  });

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    await globalThis.curve_bn128.terminate();
  });
});
