# Quick Start

To get started with HollowDB, simply install the package:

```sh
yarn add hollowdb
pnpm add hollowdb
npm install hollowdb
```

Let's quickly demonstrate with a NodeJS project to see HollowDB in action.

## Setup

Open up your favorite terminal and/or IDE and create a new directory for our fresh project:

```sh
mkdir hollowdb-example
cd hollowdb-example
```

Install HollowDB & Warp Contracts packages:

```sh
yarn add hollowdb warp-contracts
```

Finally, create yourself an Arweave wallet at <https://arweave.app/> or use an existing one if you have. Download your wallet (which will be a JSON file) and put it as `wallet.json` in the current directory.

Create a new file called `index.js`. Prepare the code as follows:

```js
const { SDK } = require("hollowdb");
const { WarpFactory } = require("warp-contracts");
const fs = require("fs");

async function main() {
  // we will write our code here...
}

main();
```

## Instantiating HollowDB

To instantiate HollowDB SDK, we need to provide a signer object (that will be our wallet), a Warp instance and a contract transaction id to specify which smart contract we are connecting to. Let's do just that!

Write the following code within your main function:

```js
// read your wallet
const wallet = JSON.parse(fs.readFileSync("./wallet.json").toString());

// use an existing contract
// to deploy your own, read "Contract Operations" section :)
const contractTxId = "_eVfQYDOLpd-0QX0yt7RV2CXE5D9U0otCz9BNBiJMYY";

// we will use Mainnet
const warp = WarpFactory.forMainnet();

// create the SDK!
const sdk = new SDK(wallet, contractTxId, warp);
```

### Generating proofs & computing the key

The contract we are connecting to in this example uses zero-knowledge proofs to update keys. So, we can very much get a value at some key, or put a new key-value pair; but when it comes to updating them we will need to generate proofs!

We can use **HollowDB Prover** for this:

```js
const { Prover, computeKey } = require("hollowdb-prover");
```

## Getting & Setting keys

It's time to put everything to use! Here is what we will do:

- define a secret that is related to our key
- put some value to that key
- update that value using a zero-knowledge proof

First, we will define our secret, which can be anything that you'd like. We can say `secret=2023` for this example; although, if you really care about the secret staying that way, you should make a longer secret.

Let's go back to writing code within our `main` function:

```js
const secret = BigInt("0xDEADBEEF"); // or something that only YOU know :)
const key = computeKey(secret);
console.log("Key:", key);
```

We have created our key just like that. Everyone expect you will see that huge number, but only you know that the key was created with `0xDEADBEEF`. Let's put the string "hello world" to this key in our key-value database:

```js
await sdk.put(key, "hello world"); // put a value
console.log(await sdk.get(key)); // get that value
```

As simple as that. Now, let's update our value at this key to `seeya world`. To do that, we will need to create a zero-knowledge proof that we know the secret which belongs to this key.

We can use the Prover utility for that. We need the WASM file for the circuit, and the prover key. You can find these at the links below:

- [WASM Circuit](https://github.com/firstbatchxyz/hollowdb/blob/master/config/circuits/hollow-authz-groth16/hollow-authz.wasm)
- [Prover Key](https://github.com/firstbatchxyz/hollowdb/blob/master/config/circuits/hollow-authz-groth16/prover_key.zkey)

Download these files and add them to the project directory. Then, create the prover as follows:

```js
const prover = new Prover(
  "./hollow-authz.wasm",
  "./prover_key.zkey",
  "groth16"
);
```

To generate the proof, we provide our secret, along with the current value & next value:

```js
const { proof } = await prover.prove(secret, "hello world", "seeya world");
```

We can now update our value using the SDK:

```js
await sdk.update(key, "seeya world", proof); // update value
console.log(await sdk.get(key)); // get the new value
```

## Final Code

That is it! Our final `index.js` looks like the following:

```js
const { SDK } = require("hollowdb");
const { WarpFactory } = require("warp-contracts");
const { Prover, computeKey } = require("hollowdb-prover");
const fs = require("fs");

async function main() {
  // read your wallet
  const wallet = JSON.parse(fs.readFileSync("./wallet.json").toString());

  // use an existing contract
  // to deploy your own, read "Contract Operations" section :)
  const contractTxId = "_eVfQYDOLpd-0QX0yt7RV2CXE5D9U0otCz9BNBiJMYY";

  // we will use Mainnet
  const warp = WarpFactory.forMainnet();

  // create the SDK!
  const sdk = new SDK(wallet, contractTxId, warp);

  const secret = BigInt(2023);
  const key = computeKey(secret);
  console.log("Key:", key);

  console.log("Putting a value...");
  await sdk.put(key, "hello world"); // put a value
  console.log(await sdk.get(key)); // get that value

  console.log("Generating a proof for update...");
  const prover = new Prover(
    "./hollow-authz.wasm",
    "./prover_key.zkey",
    "groth16"
  );

  console.log("Generating a proof:");
  const { proof } = await prover.prove(secret, "hello world", "seeya world");

  console.log("Updating the value...");
  await sdk.update(key, "bye bye world", proof); // update value
  console.log(await sdk.get(key)); // get the new value
}

main();
```
