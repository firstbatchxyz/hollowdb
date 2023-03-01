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
- `contractTxId`: the transaction id of your contract deployment.
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
let {proof} = await generateProof(keyPreimage, curValueTx, newValueTx);
await sdk.update(key, newValue, proof);

// UPDATE without a proof
await sdk.update(key, newValueTx);

// REMOVE with a proof
let {proof} = await generateProof(keyPreimage, curValueTx, null);
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
  put: true, // e.g. check for proofs on PUT operations
  update: false, // but don't care for UPDATE & REMOVE operations
});

// add some user addresses to the PUT whitelist
await admin.addUsersToWhitelist([aliceAddr, bobAddr], 'put');

// remove someone from the whitelist
```

Usage of proofs can be enabled by setting `isProofRequired: true` in the contract state.

### Generating the proof

Proof generation is not provided by the HollowDB package, it is left to the developer to integrate the proof within their flow.

Each key in the database is the Poseidon hash of some preimage, the client must provide a preimage knowledge proof to update or remove a value at that key. Additional constraints on the current value and next value to be written are also given to the proof as a preventive measure against replay attacks and middle-man attacks.

A utility to function to generate the proof is written as follows:

```ts
export async function generateProof(
  preimage: bigint,
  curValueTx: string | null,
  nextValueTx: string | null
): Promise<{proof: object; publicSignals: bigint[]}> {
  const fullProof = await snarkjs.groth16.fullProve(
    {
      idCommitment: preimage,
      curValueTx: curValueTx ? valueTxToBigInt(curValueTx) : 0n,
      nextValueTx: nextValueTx ? valueTxToBigInt(nextValueTx) : 0n,
    },
    WASM_PATH,
    PROVERKEY_PATH
  );
  return fullProof;
}

// convert a string to bigint, output ensured to be in BN128 curve finite field
export const valueTxToBigInt = (valueTx: string): bigint => {
  return (
    BigInt('0x' + Buffer.from(valueTx).toString('hex')) %
    BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')
  );
};
```

Your client will should use the `fullProof.proof` object while making requests; the `fullProof.publicSignals` will be provided by the contract to verify the proof. For more information on using the proofs, check the [tests](./tests/hollowdb.test.ts).

### Building the contract

The contract is written in TypeScript, but to deploy using Warp you require the JS implementation, for which we use ESBuild. To build your contract, a shorthand script is provided within this repository:

```sh
yarn contract:build
```

This will generate the built contract under `build/hollowDB/contract.js`.

### Deploying the contract

To deploy the contract yourself, you need an Arweave wallet. Download your wallet as JWK and save it under [config/wallet](./config/wallet/) folder. Afterwards, use the following script:

```bash
yarn contract:deploy <wallet-name>
```

This runs the deployment code under the [tools](./src/tools/) folder, which internally uses the static deploy function of the `Admin` toolkit. It will use the wallet `./config/wallet/<wallet-name>.json` with `wallet-main` as the default name.

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
