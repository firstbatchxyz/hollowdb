# HollowDB

> HollowDB is a decentralized privacy-preserving key-value database on Arweave network, powered by Warp Contracts.

A key-value database is a non-relational database, where data is simply stored as a collection of pairs: a key and a corresponding value. Arweave is a decentralized storage network, essentially providing a decentralized permanent-storage for all kinds of data. You can write smart-contracts in Arweave using SmartWeave. In particular, Warp Contracts provide much more functionality atop SmartWeave for developers to write more advanced smart-contracts.

HollowDB essentially operates on a smart-contract that provides an interface for a key-value database that lives on Arweave, essentially making it a decentralized key-value database. Here is the catch though, if the smart-contract is handling all the operations, how are we going to achieve authenticated operations? That is, we only want owners of data to be able to update them, or remove them.

This is where HollowDB utilizes zero-knowledge proofs. A zero-knowledge proof is a proof where the prover reveals no extra information other than the fact that some statement is true. Thanks to recent developments within the last decade or so, generating proofs and verifying them have become much more efficient. In particular, proof size is very small and verification happens very quickly. Thanks to this, we can verify proofs at contract level!

In HollowDB, users prove that they own a key for some key-value pair, and they do this using a preimage-knowledge proof where the key is the digest from some hash function. In doing so, they do not reveal who they are as the digest is really just a random looking string and the proof reveals nothing about the preimage. This functionality makes HollowDB privacy-preserving.

Each smart-contract in HollowDB can be thought of as a separate key-value database. Users may deploy their own contracts using our repository, and then interact with them using the HollowDB SDK.

In short, HollowDB is made of the following components:

- A SmartWeave smart contract that is the interface to the key-value storage on Arweave.
- A SnarkJS plugin for Warp Contracts, enabling zero-knowledge proof verification at contract level.
- An NPM package that provides a very simple interface to interact with a HollowDB contract, as well as administrative operations such as changing owner & updating state.

## Modes of Operation

HollowDB has two modus operandi: proofs and whitelisting; both can be enabled together, or separately.

### Proofs Mode

Using zero-knowledge proofs gives full control to the users on updating the value at their key. When proofs are enabled:

- Anyone can read and put.
- To update or remove a value at some key, user must provide a zero-knowledge proof (ZKP) related to that key.

You can enable or disable proof checking with the following Admin command:

```ts
const isProofRequired = true; // or false
await admin.updateProofRequirement("auth", isProofRequired);
```

If you are deploying your own contract, you must also provide the verification key that the proof verifier will use. You can find HollowDB's keys [here](https://github.com/firstbatchxyz/hollowdb/tree/master/config/circuits). You can either provide the key in the initial state, or use the Admin to update the verification key at a later time:

```ts
await admin.updateVerificationKey("auth", newVerificationKey);
```

### Whitelisting Mode

Whitelisting is an alternative authorization mechanism that can be used within HollowDB. It can provide a fine-grained control over who can put, update, or remove a value to the database. When whitelisting is enabled:

- Anyone can read.
- To put, the user must have been put-whitelisted by the contract owner.
- To update or remove, the user must have been update-whitelisted by the contract owner.

There is a separate whitelist for put and update/remove. You can enable/disable them with the Admin:

```ts
const isPutWhitelistRequired = true; // or false
const isUpdateWhitelistRequired = true; // or false
await admin.updateWhitelistRequirement("put", isPutWhitelistRequired);
await admin.updateWhitelistRequirement("update", isUpdateWhitelistRequired);
```

You can add & remove users from the whitelist using the Admin:

```ts
const whitelistType = "put"; // or "update"

// add some users
const addressesToAdd = [address1, address2 /*, ... */];
await admin.updateWhitelist(addressesToAdd, whitelistType, "add");

// remove some users
const addressesToRemove = [address3, address4 /*, ... */];
await admin.updateWhitelist(addressesToRemove, whitelistType, "remove");
```

## Large Values

Currently Warp Contracts only support transactions that are below 2KB in size; however you can put arbitrarily large values with the following trick:

1. upload the large value using a bundler, such as Irys
2. retrieve the transaction id for that value
3. put the transaction id in the key-value storage

To retrieve the value, simply get the transaction id from the storage and read the value from Arweave with:

```ts
const response = await fetch(`https://arweave.net/${transactionId}`);
```

In other words, you will store `key, valueTxId` instead of `key, value`! This will enable you to store arbitrarily large amounts of data, and retrieve them with respect to their transaction ids, also while reducing the overall size of the contract cache. Albeit, it comes with the cost of paying fees for the bundler.

## Supported Wallets

HollowDB supports both Arweave wallets and Ethereum wallets. In this page, we will show several ways to create the `signer` object.

### Arweave

An Arweave wallet is defined by a JWKInterface object, which is simply a JSON file that you can download from arweave.app. You can read the JSON object from disk, and pass it as the signer to HollowDB.

```ts
import { JWKInterface } from "warp-contracts";

const jwkPath = "./some-wallet.json";
const signer = JSON.parse(
  fs.readFileSync(walletPath).toString()
) as JWKInterface;
```

Always `.gitignore` your wallets!

### Injected Arweave Wallet

If you are using HollowDB in browser, you can use arweave-wallet-connector to connect to your existing wallet on arweave.app and use it as an injected wallet in HollowDB! This is done by providing the string "use_wallet" as the signer argument, which internally does the same to connect to Warp Contracts.

Using an injected Arweave wallet will trigger a pop-up on each interaction, similar to MetaMask pop-ups where you sign the transaction.

```ts
// instantiate Arweave Web Wallet
const arweaveWebWallet = new ArweaveWebWallet(
  {
    name: "your-app-name",
    logo: "your-app-logo",
  },
  {
    state: {
      url: "arweave.app",
    },
  }
);

// connect
await arweaveWebWallet.connect();

// the magic string
const signer = "use_wallet";
```

### Ethereum Wallets

Similar to injected Arweave wallet, you can use an injected EVM-compatible wallet (such as MetaMask) to connect to HollowDB. This is made possible with the Warp Contract Signature plugin. Please refer to their documentation for more details.

Once you are able to obtain the evmSignature as described in their documentation, you can use the following signer for HollowDB:

```ts
import { CustomSignature } from "warp-contracts";

// assuming `evmSignature` exists at this point
const signer: CustomSignature = {
  signer: evmSignature,
  signatureType: "ethereum",
};
```

## Caching Options

Warp uses LevelDB on Node and IndexedDB on browser for caching by default. It allows overriding the cache to be used via `useStateCache` and `useContractCache`; as well as overriding the underlying key-value storage via `useKVStorageFactory`. These overrides accept any cache interface that supports the [SortKeyCache interface](https://github.com/warp-contracts/warp/blob/main/src/cache/SortKeyCache.ts) of Warp Contracts, see the relevant documentation [here](https://academy.warp.cc/docs/sdk/advanced/kv-storage#implementation-details).

Since HollowDB takes input a warp instance, by applying cache overrides to the warp instance outside and passing that instance to HollowDB, you will be able to use the caching of your choice for HollowDB!

> `useStateCache` and `useContractCache` does not work in Warp's `forLocal` instance, e.g. when used with `arlocal`. You can use KV Storage factory by itself during local tests.

There are alternative caching plugins as well:

- [LMDB](https://www.npmjs.com/package/warp-contracts-lmdb)
- [Redis](https://www.npmjs.com/package/warp-contracts-redis)
- [Postgres](https://www.npmjs.com/package/warp-contracts-postgres)

## Use Cases

HollowDB can be used in many ways, with or without a backend and with different types of wallets. Although the interface of HollowDB is very simple, there are several things to consider when you are building an application with HollowDB:

- Side-effects of lazy evaluation that is used in SmartWeave.
- Value size & usage of bundling.
- Modes of operation, i.e. **proofs** & **whitelisting**.

### Lazy Evaluation

> SmartWeave uses lazy-evaluation to move the burden of contract execution from network nodes to smart contract users. Currently, SmartWeave supports JavaScript, using the client's unmodified execution engine.

What this means is that, when a new client wants to make a transaction on a contract, they must download all preceding transactions and evaluate them locally. By doing that, they effectively reach the present state of the contract, upon which they execute their transaction.

The immediate side-effect of this is that if a contract has many interactions, it will take a longer time to lazy-evaluate it. Since HollowDB is a key-value database operated by a SmartWeave smart contract, the more keys & interaction a contract has, the longer it will take for clients to lazy-evaluate it.

Depending on your key-count and the data-size, you might prefer different architectures for your application. Let's take a look at these scenarios:

|                  | Small values / key (<2KB)                                                                                                 | Large values / key (>= 2KB)                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Few keys / user  | Client-side only is probably enough, unless this is a very active app with many users.                                    | You might use client-side only, but it would require the users to have a funded Bundlr account.    |
| Many keys / user | Client-side only may be enough, but consider a backend if there are many users. Or, use several contracts to group users. | You should use a backend with your own wallet to make the requests & upload to Bundlr when needed. |

Some examples out there:

- [An anonymous authentication service](https://github.com/merdoyovski/hollowdb-next-auth)
- [An on-chain privacy-preserving calendar](https://github.com/firstbatchxyz/hollowdb-nextjs-calendar)
