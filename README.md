# HollowDB

HollowDB is a decentralized privacy-preserving key-value database on [Arweave](https://www.arweave.org/) network, powered by [Warp Contracts](https://warp.cc/).

- Anyone can **read** a value at any key.
- To **update** or **remove** a value at some key, the user must provide a **zero-knowledge proof** that they know the preimage of the key, along with constraints.
- Only the contract owner account can **put** a value. Owner can be changed, and putting a value does not require a proof.

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

- `jwk`: your wallet, possibly read from disk in JSON format, or given in code. Make sure you `.gitignore` your wallet files.
- `contractTxId`: the transaction id of your contract deployment.
- `cacheType`: type of cache to be used, `lmdb` or `redis`.
  - if this is `redis`, then you must also provide a Redis client object via `redisClient` argument.
  - you can enable caching with the optional boolean arguments `useContractCache` and `useStateCache`; both are undefined (i.e. falsy) by default.
  - you can specify a `limitOptions` object with the fields `minEntriesPerContract` and `maxEntriesPerContract` that specify a limit of sortKey caches per key.
  - note that `useKVStorageFactory` is always enabled, and will respect the `cacheType`.
- `warp`: a Warp instance, could be for mainnet, testnet or local.

### SDK Operations

SDK provides the basic CRUD functionality.

```ts
// GET is open to everyone
await sdk.get(key);

// PUT does not require a proof, but only the owner can do it
await sdk.put(key, valueTx);

// UPDATE requires a proof
let {proof} = await generateProof(keyPreimage, curValueTx, newValueTx);
await sdk.update(key, newValueTx, proof);

// REMOVE requires a proof
let {proof} = await generateProof(keyPreimage, curValueTx, null);
await sdk.remove(key, proof);
```

Furthermore, you can read the state of contract.

```ts
const {cachedValue} await sdk.readState();
const {owner, verificationKey} = cachedValue.state;
```

### Admin Operations

The admin can change owner, or update the verification key. Admin does not have SDK functions in it, as we don't expect the Admin to be used in such a way; Admin should only be instantiated when a major change such as changing the owner or the verification key is required.

```ts
// verification key is an object obtained from SnarkJS
await admin.setVerificationKey(verificationKey);

// newOwner is a JWK wallet object, to ensure that you have access to the new owner
await admin.setOwner(newOwner);
```

### Generating the proof

Each key in the database is the Poseidon hash of some preimage, the client must provide a preimage knowledge proof to update or remove a value at that key. Additional constraints on the current value and next value to be written are also given to the proof.

```ts
export async function generateProof(
  preimage: bigint,
  curValueTx: string | null,
  nextValueTx: string | null
): Promise<{proof: object; publicSignals: [curValueTx: bigint, nextValueTx: bigint, key: bigint]}> {
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

Your client will use the `fullProof.proof` object while making requests, while the `fullProof.publicSignals` will be given by the contract to verify the proof. For more information on using the proofs, check the [tests](./tests/hollowdb.test.ts).

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

The test will run for both LMDB cache and Redis cache. For Redis, you need to have a server running, with the URL that you specify in the [Jest config](./jest.config.cjs).

## Formatting & Linting

We are using the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

```sh
yarn format
yarn lint
```
