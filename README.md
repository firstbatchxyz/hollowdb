[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/hollowdb?logo=npm)](https://www.npmjs.com/package/hollowdb)
![Test Workflow](https://github.com/firstbatchxyz/hollowdb/actions/workflows/test.yml/badge.svg?branch=master)
![Style Workflow](https://github.com/firstbatchxyz/hollowdb/actions/workflows/style.yml/badge.svg?branch=master)
[![Formatter: Prettier](https://img.shields.io/badge/formatter-prettier-f8bc45?logo=prettier)](https://prettier.io/)
[![Linter: ESLint](https://img.shields.io/badge/linter-eslint-8080f2?logo=eslint)](https://eslint.org/)

# HollowDB

HollowDB is a decentralized privacy-preserving key-value database on [Arweave](https://www.arweave.org/) network, powered by [Warp Contracts](https://warp.cc/).

HollowDB has two modus operandi: **proofs** and **whitelisting**. Both can be enabled together, or separately.

- When using proofs:

  - Anyone can **read** and **put**.
  - To **update** or **remove** a value at some key, user must provide a proof of preimage knowledge of that key.

- When using whitelisting:

  - Anyone can **read**.
  - To **put**, the user must have been whitelisted by the contract owner to do PUT operations.
  - To **update** or **remove**, the user must have been whitelisted by the contract owner to do UPDATE operations. There is no additional whitelist for **remove** since it is equivalent to updating a value as `null`.

The table below summarizes the requirements to make a transaction on HollowDB:

| Requirements          | **Put**       | **Update**           | **Remove**           | **Read** |
| --------------------- | ------------- | -------------------- | -------------------- | -------- |
| **with Proofs**       | -             | Zero-Knowledge Proof | Zero-Knowledge Proof | -        |
| **with Whitelisting** | PUT whitelist | UPDATE whitelist     | UPDATE whitelist     | -        |

## Installation

To install HollowDB:

```bash
# yarn
yarn add hollowdb
# npm
npm install hollowdb
```

## Usage

HollowDB exposes the following:

- an `SDK` class to allow ease of development with its functionalities
- an `Admin` class that handles higher authorized operations.
- a `Prover` class that provides a utility function to generate proofs for HollowDB.
- a `computeKey` function to compute the key without generating a proof.

```ts
import {SDK, Admin} from 'hollowdb';
import type {HollowDbSdkArgs} from 'hollowdb';
import {WarpFactory} from 'warp-contracts';

const warp = WarpFactory.forMainnet();
const args: HollowDbSdkArgs = {
  jwk,
  contractTxId,
  cacheType,
  warp,
};
const sdk = new SDK(args);
const admin = new Admin(args);
```

As shown in example, you must provide the 4 required arguments to Admin or SDK:

- `jwk`: your wallet, possibly read from disk in JSON format, or given in code. Make sure you `.gitignore` your wallet files!
- `contractTxId`: the transaction id of the contract. You can connect to an existing contract, or deploy one of your own and provide it's id here.
- `cacheType`: type of cache to be used, i.e. `lmdb` or `redis`.
  - if this is `redis`, then you must also provide a Redis client object via `redisClient` argument.
  - you can enable contract & state caching with the optional boolean arguments `useContractCache` and `useStateCache`; both are falsy by default.
  - you can specify a `limitOptions` object with the fields `minEntriesPerContract` and `maxEntriesPerContract` that specify a limit of [sortKey](https://academy.warp.cc/docs/sdk/advanced/bundled-interaction#1-generates-a-sort-key) caches per key.
- `warp`: the Warp instance to be used, could be for mainnet, testnet or local.

You can also provide the following optional arguments:

- `useStateCache` enables state cache, falsy by default.
- `useContractCache` enables state cache, falsy by default.
- `limitOptions` overrides the cache limit settings, it has two properties:
  - `minEntriesPerContract` defines the minimum number of keys to be stored (default 10)
  - `maxEntriesPerContract` defines the maximum number of keys to be stored (default 100)
  - after `max` is reach, `max-min` oldest keys are deleted, thus `min` many keys remain in the cache

### SDK Operations

SDK provides the basic CRUD functionality.

```ts
// compute the key from your secret
const key = computeKey(yourSecret);

// GET is open to everyone
await sdk.get(key);

// PUT does not require a proof
await sdk.put(key, value);

// UPDATE with a proof
let {proof} = await prover.generateProof(keyPreimage, curValue, newValue);
await sdk.update(key, newValue, updateProof);

// UPDATE without a proof
await sdk.update(key, newValue);

// REMOVE with a proof
let {proof} = await prover.generateProof(keyPreimage, curValue, null);
await sdk.remove(key, proof);

// REMOVE without a proof
await sdk.remove(key);

// read state variables
const {cachedValue} = await sdk.readState();
```

For more detailed explanation on the `Prover`, see the related section below.

### Admin Operations

The admin can change the contract state, but it does not have SDK functions in it as we don't expect the Admin to be used in such a way; Admin should only be instantiated when a major change such as changing the owner or the verification key is required.

```ts
// verification key is an object obtained from Circom & SnarkJS
await admin.setVerificationKey(verificationKey);

// newOwner is a JWK wallet object, to ensure that you have access to the new owner
await admin.setOwner(newOwner);

// proofs checking
await admin.setProofRequirement(false); // e.g. disables proof checking

// whitelisting
await admin.setWhitelistRequirement({
  put: true, // e.g. check for whitelist on PUT operations
  update: false, // but don't care for UPDATE & REMOVE operations
});

// add some user addresses to the PUT whitelist
await admin.addUsersToWhitelist([aliceAddr, bobAddr], 'put');

// remove someone from the whitelist
await admin.removeUsersFromWhitelist([bobAddr], 'put');
```

### Building & deploying the contract

The contract is written in TypeScript, but to deploy using Warp you require the JS implementation, for which we use ESBuild. To build your contract, a shorthand script is provided within this repository:

```sh
yarn contract:build
```

This will generate the built contract under `build/hollowDB/contract.js`. To deploy this contract, you need an Arweave wallet. Download your wallet as JWK and save it under [config/wallet](./config/wallet/) folder. Afterwards, use the following script:

```bash
yarn contract:deploy <wallet-name>
```

This runs the deployment code under the [tools](./src/tools/) folder, which internally uses the static deploy function of the `Admin` toolkit. It will use the wallet `./config/wallet/<wallet-name>.json` with `wallet-main` as the default name.

### Values larger than 2KB

Currently [Warp Contracts](https://warp.cc/) only support transactions that are below 2KB in size. Since 2KB may not be sufficient for all use cases, we suggest using [bundlr](https://bundlr.network/) to upload your data to Arweave network, and only store the transaction ID within the contract.

In other words, you will store `key, valueTxId` instead of `key, value`! This will enable you to store arbitary amounts of data, and retrieve them with respect to their transaction ids, also while reducing the overall size of the contract.

We use such an approach in our [HollowDB gRPC server](https://github.com/firstbatchxyz/HollowDB-grpc), for more details please refer to [this document](https://github.com/firstbatchxyz/HollowDB-grpc/blob/master/docs/bundlr.md).

## Zero-Knowledge Proofs

HollowDB is a **key-value** database where each **key** in the database is the [Poseidon hash](https://www.poseidon-hash.info/) of some preimage. The client provides a "preimage knowledge proof" to update or remove a value at that key. Additional constraints on the current value and next value to be written are also given to the proof as a preventive measure against replay attacks and middle-man attacks.

[![hollow-authz-mermaidjs](https://mermaid.ink/img/pako:eNpdkLtuwzAMRX9F4OQACZBk9NCpQ4dO7WhlYCQ6ImI9oAfaNMi_V7bT1O0mnnsgXPIKymuCFvrBfyiDMYvXN-mECNyFchxYSenYhZLTYcS8bUIktniildhsnkTiLpGKlP95u0aV-ILJ_GgT3TeOPvNfPAapHE8RgxHGD7WIwJLNl1AcVeE8CTz5Brs7PMwl73T-xeA0huh9v5h950t-NCOnZ9vP4fZRdAF3vz0XdN-c6bKCNViKFlnXs13HWEI2ZElCW58a41mCdLfq1TX8-8UpaHMstIYSNGZ6ZqzLWmh7HBLdvgG7u38h?type=png)](https://mermaid.live/edit#pako:eNpdkLtuwzAMRX9F4OQACZBk9NCpQ4dO7WhlYCQ6ImI9oAfaNMi_V7bT1O0mnnsgXPIKymuCFvrBfyiDMYvXN-mECNyFchxYSenYhZLTYcS8bUIktniildhsnkTiLpGKlP95u0aV-ILJ_GgT3TeOPvNfPAapHE8RgxHGD7WIwJLNl1AcVeE8CTz5Brs7PMwl73T-xeA0huh9v5h950t-NCOnZ9vP4fZRdAF3vz0XdN-c6bKCNViKFlnXs13HWEI2ZElCW58a41mCdLfq1TX8-8UpaHMstIYSNGZ6ZqzLWmh7HBLdvgG7u38h)

As shown above, all inputs are secret for HollowDB prover, although `curHash` and `nextHash` are immediately provided as an output.

### Generating Proofs with Prover

HollowDB provides a `Prover` class to ease the generation of proofs. First, you must make sure to have the circuit WASM file and prover key in your device, the paths to these files are required by the prover. Verification is done at the contract side, with the verification key being stored in the state of the contract itself.

You can obtain all these files from this repository:

- [WASM Circuit](./circuits/hollow-authz/hollow-authz.wasm): required by the Prover
- [Prover Key](./circuits/hollow-authz/prover_key.zkey): required by the Prover
- [Verification Key](./circuits/hollow-authz/verification_key.json): required by the contract if you would like to write your own

Here is how to use the prover class:

```ts
import {SDK, Prover, computeKey} from 'hollowdb';

// instantiate the SDK, shown above
// ...

// instantiate the prover
const wasmPath = '/some/path/to/hollow-authz.wasm';
const proverkeyPath = '/some/path/to/prover_key.zkey';
const prover = new Prover(wasmPath, proverkeyPath);

// your key preimage and values
const keyPreimage = BigInt(1122334455);
const curValue = 'previously-stored-value';
const newValue = 'new-awesome-value';

// generate the `fullProof` using Groth16, which has `proof` and `publicSignals`
// the name comes from SnarkJS's `fullProve` function
// values are hashed inside the `generateProof` function,
// so you don't have to worry about hashing yourself
let fullProof = await prover.generateProof(preimage, curValue, newValue);

// compute key
// you can also get this from fullProof.publicSignals[2]
const key = computeKey(preimage);

// get the actual proof object
const proof = fullProof.proof;

// update the value at this key!
await sdk.update(key, newValue, proof);
```

You might notice that the `key` is being read from the public signals. This is because we need to hash the preimage with Poseidon hash to make this request. If you do not have the key in the first place, you can use a package such as [Poseidon Lite](https://www.npmjs.com/package/poseidon-lite) to easily find the hash of your preimage.

## Testing

There are Jest test suites for HollowDB operations that operate on a local Arweave instance using [ArLocal](https://www.npmjs.com/package/arlocal). To run:

```sh
yarn test
```

The test will run for both LMDB cache and Redis cache. For Redis, you need to have a server running, with the URL that you specify within the [Jest config](./jest.config.cjs).

## Styling

We are using the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

```sh
# formatting with prettier
yarn format
# linting with eslint
yarn lint
```
