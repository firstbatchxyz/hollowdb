import {createHash} from 'crypto';
import {poseidon1} from 'poseidon-lite/poseidon1';

// we need to import like this due to a bug
// https://vivianblog.hashnode.dev/how-to-create-a-zero-knowledge-dapp-from-zero-to-production
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {groth16, plonk} from 'snarkjs';

const bn254Prime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
const TooLargeError = new Error('Preimage is larger than the order of scalar field of BN254.');

/** A zero-knowledge prover utility to be used with HollowDB.
 *
 * You will need to provide paths to a WASM circuit, and a prover key.
 * You can find these files [here](./circuits/) in the repository. it is up to you to decide where to place them for your application.
 * For example, in a web-app you may place under the `public` directory.
 *
 * You can also choose to provide the protocol, which defaults to Groth16.
 */
export class Prover {
  constructor(
    private readonly wasmPath: string,
    private readonly proverKeyPath: string,
    readonly protocol: 'groth16' | 'plonk' = 'groth16'
  ) {}

  /** Generate a zero-knowledge proof.
   *
   * Calls {@link hashToGroup} on inputs, and then generates
   * a proof with {@link proveHashed}.
   */
  async prove(
    preimage: bigint,
    curValue: unknown,
    nextValue: unknown
  ): Promise<{proof: object; publicSignals: [curValueHash: string, nextValueHash: string, key: string]}> {
    return await this.proveHashed(preimage, hashToGroup(curValue), hashToGroup(nextValue));
  }

  /** Generate a zero-knowledge proof.
   *
   * Value inputs are expected to be results of {@link hashToGroup}. The
   * incentive of using this function instead of {@link prove} is that the
   * hash may be stored somewhere, and there is no need to hash the entire value
   * again at a later time instead of using the existing hash.
   */
  async proveHashed(
    preimage: bigint,
    curValueHash: bigint,
    nextValueHash: bigint
  ): Promise<{proof: object; publicSignals: [curValueHash: string, nextValueHash: string, key: string]}> {
    if (preimage >= bn254Prime) {
      throw TooLargeError;
    }

    return await (this.protocol === 'groth16' ? groth16 : plonk).fullProve(
      {
        preimage,
        curValueHash,
        nextValueHash,
      },
      this.wasmPath,
      this.proverKeyPath
    );
  }
}

/** Given an input, stringifies and then hashes it and make sure the result is circuit-friendly for
 * [BN254](https://docs.circom.io/background/background/#signals-of-a-circuit).
 *
 * Uses Ripemd160 for the hash where 160-bit output is guaranteed to be
 * circuit-friendly (i.e. within the order of the curve's scalar field).
 *
 * If a given value is falsy, it will NOT be hashed but instead mapped to 0.
 */
export function hashToGroup(value: unknown): bigint {
  if (value) {
    return BigInt(
      '0x' +
        createHash('ripemd160')
          .update(Buffer.from(JSON.stringify(value)))
          .digest('hex')
    );
  } else {
    return BigInt(0);
  }
}

/** Compute the key that is the Poseidon hash of some preimage.
 *
 * The returned key is a string in hexadecimal format with 0x prefix.
 */
export function computeKey(preimage: bigint): string {
  if (preimage >= bn254Prime) {
    throw TooLargeError;
  }

  return '0x' + poseidon1([preimage]).toString(16);
}
