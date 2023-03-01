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

## Usage

To install HollowDB:

```bash
# yarn
yarn add hollowdb
# npm
npm install hollowdb
```

HollowDB exposes a SDK to allow ease of development with its functionalities, along with an Admin SDK that handles higher authorized operations. To instantiate the SDK, you must provide an Arweave Wallet along with the contract transaction id.

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

As shown in example, you must provide 4 required arguments:

- `jwk`: your wallet, possibly read from disk in JSON format, or given in code. Make sure you .gitignore your wallet files!
- `contractTxId`: the transaction id of the contract. You can **connect to an existing contract**, or deploy one of your own and provide it's id here.
- `cacheType`: type of cache to be used, i.e. `lmdb` or `redis`.
  - if this is `redis`, then you must also provide a Redis client object via `redisClient` argument.
  - you can enable contract & state caching with the optional boolean arguments `useContractCache` and `useStateCache`; both are falsy by default.
  - you can specify a `limitOptions` object with the fields `minEntriesPerContract` and `maxEntriesPerContract` that specify a limit of [sortKey](https://academy.warp.cc/docs/sdk/advanced/bundled-interaction#1-generates-a-sort-key) caches per key.
- `warp`: the Warp instance to be used, could be for mainnet, testnet or local.

### SDK Operations

SDK provides the basic CRUD functionality, along with a helper function to read the contract state.

```ts
// GET is open to everyone
await sdk.get(key);

// PUT does not require a proof
await sdk.put(key, value);

// UPDATE with a proof
let {proof} = await generateProof(keyPreimage, curValue, newValue);
await sdk.update(key, newValue, proof);

// UPDATE without a proof
await sdk.update(key, newValue);

// REMOVE with a proof
let {proof} = await generateProof(keyPreimage, curValue, null);
await sdk.remove(key, proof);

// REMOVE without a proof
await sdk.remove(key);

// read state variables
const {cachedValue} = await sdk.readState();
```

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
await ownerAdmin.removeUsersFromWhitelist([bobAddr], 'put');
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

Proof generation is not provided by the HollowDB package, it is left to the developer to integrate the proof within their flow.

Each key in the database is the Poseidon hash of some preimage, the client must provide a preimage knowledge proof to update or remove a value at that key. Additional constraints on the current value and next value to be written are also given to the proof as a preventive measure against replay attacks and middle-man attacks.

A utility to function to generate the proof is written as follows:

```ts
export async function generateProof(
  preimage: bigint,
  curValue: string | null,
  nextValue: string | null
): Promise<{proof: object; publicSignals: bigint[]}> {
  const fullProof = await snarkjs.groth16.fullProve(
    {
      idCommitment: preimage,
      curValue: curValue ? stringToBigInt(curValue) : 0n,
      nextValue: nextValue ? stringToBigInt(nextValue) : 0n,
    },
    WASM_PATH,
    PROVERKEY_PATH
  );
  return fullProof;
}

// naively convert a string to bigint, output ensured to be in BN128 curve finite field
export const stringToBigInt = (value: string): bigint => {
  return (
    BigInt('0x' + Buffer.from(value).toString('hex')) %
    BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')
  );
};
```

Your client will should use the `fullProof.proof` object while making requests; the `fullProof.publicSignals` will be provided by the contract to verify the proof. For more information on using the proofs, check the [tests](./tests/hollowdb.test.ts).

You can use the prover key, WASM circuit and the verification key that we provide under [circuits](./circuits/hollow-authz/) folder to generate proofs and verify them.

## Testing

There are Jest test suites for HollowDB operations that operate on a local Arweave instance using [ArLocal](https://www.npmjs.com/package/arlocal). To run:

```sh
yarn test
```

The test will run for both LMDB cache and Redis cache. For Redis, you need to have a server running, with the URL that you specify within the [Jest config](./jest.config.cjs).

## Formatting & Linting

We are using the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

```sh
yarn format
yarn lint
```
