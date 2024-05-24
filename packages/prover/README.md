<p align="center">
  <img src="https://raw.githubusercontent.com/firstbatchxyz/hollowdb/master/logo.svg" alt="logo" width="142">
</p>

<p align="center">
  <h1 align="center">
    HollowDB Prover
  </h1>
  <p align="center">
    <i>Proof generator package for HollowDB.</i>
  </p>
</p>

<p align="center">
    <a href="https://opensource.org/licenses/MIT" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg">
    </a>
    <a href="https://www.npmjs.com/package/hollowdb-prover" target="_blank">
        <img alt="NPM" src="https://img.shields.io/npm/v/hollowdb-prover?logo=npm&color=CB3837">
    </a>
    <a href="https://docs.hollowdb.xyz/zero-knowledge-proofs/hollowdb-prover" target="_blank">
        <img alt="Docs" src="https://img.shields.io/badge/docs-hollowdb-3884FF.svg?logo=gitbook">
    </a>
    <a href="./.github/workflows/test.yml" target="_blank">
        <img alt="Workflow: Tests" src="https://github.com/firstbatchxyz/hollowdb-prover/actions/workflows/test.yml/badge.svg?branch=master">
    </a>
</p>

## Installation

HollowDB prover is an NPM package. You can install it as:

```sh
yarn add hollowdb-prover    # yarn
npm install hollowdb-prover # npm
pnpm add hollowdb-prover    # pnpm
```

## Usage

<!-- See documentation at https://docs.hollowdb.xyz/zero-knowledge-proofs/hollowdb-prover. -->

To generate proofs, you will need the zero-knowledge circuit WASM file, and a prover key. Both can be found within the repo, see [here](../circuits/). Notice that there are separate files for each protocol, **Groth16** and **PLONK** respectively.

To create the prover:

```ts
const prover = new Prover(
  "./path-to-circuit-wasm",
  "./path-to-prover-key",
  "groth16" // or "plonk"
);
```

Let us explain the constructor arguments in order:

- `wasmPath` is the relative path to the circuit WASM file. In a web application, this file can be stored under public.
- `proverKeyPath` is the relative path to the WASM circuit. In a web application, this file can be stored under public.
- `protocol` is the proof system to be used, that is either `groth16` or `plonk`. HollowDB supports both proof systems, and the verifier can determine which one to use by looking at the verification key.

To generate a proof, simply call `prove` function of the newly created `prover`:

```ts
const {proof, publicSignals} = prover.prove(PREIMAGE, CURRENT_VALUE, NEXT_VALUE);
```

The proof object here shall be provided to HollowDB contract, where it will be checked to verify. Note that public signals are also exported, although we do not use them; the contract obtains them in it's own ways.

The value inputs are "hashed-to-group" and then fed into the circuit. See the section below for more information. For the curious, the public signals is a triple with the following elements in order:

- Current value hash
- Next value hash
- Key, equal to Poseidon hash of the preimage

### Prove with Hashes

The `prove` function takes as input two objects, and it converts them to be circuit-friendly inputs within the function. If you would like to re-use these hashes, or you simply have access to them, you can generate a proof from them too:

```ts
const {proof} = prover.proveHashed(PREIMAGE, CUR_VAL_HASH, NEXT_VAL_HASH);
```

### Proving in NextJS

Note that to use SnarkJS in a NextJS environment you may need to configure some settings w.r.t server-side rendering. We suggest adding the following Webpack option to your NextJS config:

```js
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: false, // added for SnarkJS
      readline: false, // added for SnarkJS
    };
  }
  // added to run WASM for SnarkJS
  config.experiments = { asyncWebAssembly: true };
  return config;
},
```

You might also have to make some configurations in other frameworks if you have server-side rendering enabled.

### Computing the Key without Proofs

When HollowDB is used with proofs in particular, the z is computed by taking the [Poseidon hash](https://www.poseidon-hash.info/) of some secret preimage. The key can be extracted from the z which is in the object that is returned from the z function.

However, if one wants to compute the z without creating a proof (e.g. the user just wants to get a value at their own key) they can do so with `computeKey`.

```ts
import {computeKey} from "hollowdb-prover";

const key = computeKey(PREIMAGE);
```

### Hash-to-Group

To "embed" the current value and next value within our proofs, we need to map them to a number. This number must be circuit-friendly, and we provide a `hashToGroup` function for this purpose:

```ts
import {hashToGroup} from "hollowdb-prover";

const valueHashed: bigint = hashToGroup({foo: "bar", num: 123});
const valueHashedHex: string = "0x" + valueHashed.toString(16);
```

## Example

The proof verification is done within the smart-contract side, so as a developer we will mostly be looking at the proof generation that happens on the client side. Below is an example:

```ts
import {SDK} from "hollowdb";
import {Prover, computeKey} from "hollowdb-prover";
import {WarpFactory, JWKInterface} from "warp-contracts";
import fs from "fs";

// read wallet
const walletPath = __dirname + "/wallet-name.json";
const wallet = JSON.parse(fs.readFileSync(walletPath).toString()) as JWKInterface;

// instantiate SDK
const contractTxId = "<your-contract-txid>";
const sdk = new SDK(wallet, contractTxId, WarpFactory.forMainnet());

// instantiate the prover
const wasmCircuitPath = __dirname + "/circuit.wasm";
const proverKeyPath = __dirname + "/prover_key.zkey";
const prover = new Prover(wasmCircuitPath, proverKeyPath);

// compute your key from secret
const secret = BigInt("0xDEADBEEF");
const key = computeKey(secret);

// generate a proof for UPDATE
const currentValue = await sdk.get(key);
const nextValue = "this is a new value!";
const {proof} = await prover.prove(secret, currentValue, nextValue);

// update
await sdk.update(key, nextValue, proof);
```

Let's digest this code step by step:

1. First, we read our Arweave wallet from file, to be used for our transactions. You could also provide the wallet as a JSON object within the code too (but you should be careful not to expose your wallet & accidentally commit them to your repo).
2. Then, we create the HollowDB SDK object. For this, we provide our wallet, we specify the cache type to be LMDB, and we provide the contract transaction id along with a Warp instance. Basically, we are "connecting" to our contract on the Mainnet.
3. We now create our Prover object, which is a wrapper around a few SnarkJS functions to generate a proof. We have to provide a path to our WASM circuit and a prover key to create this object. You can obtain them from our repository, and host them on your side. For example, if you are writing a web application, you could host them under the public folder.
4. We need to compute the key, which is the hash of our preimage. You could generate a dummy proof and read the key from its output, but that is not really efficient. Instead, HollowDB exports a computeKey function for this purpose.
5. Then, we generate our proof by simply calling prove with the required arguments, that are the inputs we have shown in the above diagram.
6. Finally, we call sdk.update to update the value at our key, using our zero-knowledge proof!

## Testing

To run tests for both Groth16 and PLONK:

```sh
yarn test
```
