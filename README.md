# HollowDB

HollowDB is a decentralized privacy-preserving key-value database on [Arweave](https://www.arweave.org/) network, powered by [Warp Contracts](https://warp.cc/).

Anyone can read & put a value; however, to update or remove a value at some key, the user must provide a **zero-knowledge proof** that they know the preimage of the key.

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
  - you can enable caching with the optional boolean arguments `useContractCache` and `useStateCache`, both undefined (i.e. falsy) by default.
  - `useKVStorageFactory` is always enabled, and will respect the `cacheType`.
- `warp`: a Warp instance, could be for mainnet, testnet or local.

### Generating a proof

Each key in the database is the Poseidon hash of some preimage, the client must provide a preimage knowledge proof to update or remove a value at that key.

```ts
export async function generateProof(
  preimage: bigint,
  curValueTx: string
): Promise<{proof: object; publicSignals: string[]}> {
  // `yarn add snarkjs` to get snarkjs
  const fullProof = await snarkjs.groth16.fullProve(
    {
      id_commitment: preimage,
      valueTx: valueTxToBigInt(curValueTx),
    },
    WASM_PATH, // circuits/hollow-authz/hollow-authz.wasm
    PROVERKEY_PATH // circuits/hollow-authz/prover_key.zkey
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

Your client will use the proof object while making requests, for more information check the [tests](./tests/hollowdb.test.ts).

### Building the contract

The contract is written in TypeScript, but to deploy using Warp you require the JS implementation, for which we use ESBuild. To build your contract, simply:

```sh
yarn build:ts
```

This will generate the built contract under `build/hollowDB/contract.js`.

### Deploying the contract

To deploy the contract yourself, you need an Arweave wallet. Download your wallet as JWK and save it under [config/wallet](./config/wallet/) folder. Afterwards, use the following script:

```bash
yarn contract:deploy <wallet-name>
```

This runs the deployment code under the [tools](./src/tools/) folder, which internally uses the static deploy function of the `Admin` toolkit. It will use the wallet `./config/wallet/<wallet-name>.json` with `wallet-main` as the default name.

## Testing

There are Jest test suites for HollowDB operations that operate on a local Arweave instance (via ArLocal). To run, simply:

```sh
yarn test
```
