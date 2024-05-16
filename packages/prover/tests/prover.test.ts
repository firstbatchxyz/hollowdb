import {readFileSync} from 'fs';
import {Prover, computeKey, hashToGroup} from '../src';
import constants from './constants';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import * as snarkjs from 'snarkjs';

describe('prover', () => {
  const secret = 'my lovely lovely secret';
  const preimage = BigInt(hashToGroup(secret));
  const CUR_VALUE = {
    lorem: 'ipsum',
    foo: 123,
    bar: true,
  };
  const NEXT_VALUE = {
    lorem: 'dolor',
    foo: 987,
    bar: false,
  };

  describe.each(['groth16', 'plonk'] as const)('%s protocol', protocol => {
    let prover: Prover;
    let verificationKey: object;
    let proof: object;
    let correctKey: string;
    let correctCurValueHash: string;
    let correctNewValueHash: string;

    beforeAll(async () => {
      prover = new Prover(constants[protocol].WASM_PATH, constants[protocol].PROVERKEY_PATH, protocol);
      verificationKey = JSON.parse(readFileSync(constants[protocol].VERIFICATIONKEY_PATH, 'utf-8'));

      // generate a proof
      const fullProof = await prover.prove(preimage, CUR_VALUE, NEXT_VALUE);
      proof = fullProof.proof;
      correctCurValueHash = fullProof.publicSignals[0];
      correctNewValueHash = fullProof.publicSignals[1];
      correctKey = '0x' + BigInt(fullProof.publicSignals[2]).toString(16);

      // computeKey should find the same result
      expect(correctKey).toEqual(computeKey(preimage));
    });

    it('should verify proof', async () => {
      const result = await snarkjs[protocol].verify(
        verificationKey,
        [correctCurValueHash, correctNewValueHash, correctKey],
        proof
      );
      expect(result).toEqual(true);
    });

    it('should NOT verify proof with wrong current value', async () => {
      const result = await snarkjs[protocol].verify(verificationKey, ['12345', correctNewValueHash, correctKey], proof);
      expect(result).toEqual(false);
    });

    it('should NOT verify proof with wrong new value', async () => {
      const result = await snarkjs[protocol].verify(verificationKey, [correctCurValueHash, '12345', correctKey], proof);
      expect(result).toEqual(false);
    });

    it('should NOT verify proof with wrong key', async () => {
      const result = await snarkjs[protocol].verify(
        verificationKey,
        [correctCurValueHash, correctNewValueHash, '12345'],
        proof
      );
      expect(result).toEqual(false);
    });
  });

  afterAll(async () => {
    // need to terminate curve_bn128 so that tests do not hang
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const curve_bn128 = global.curve_bn128;
    if (curve_bn128) {
      await curve_bn128.terminate();
    }
  });
});
