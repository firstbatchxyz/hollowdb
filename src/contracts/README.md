# HollowDB Contracts

HollowDB itself is a SmartWeave contract. In particular, we use Warp Contracts which is like SmartWeave on steroids. We provide a utility tool to work with contracts, i.e. deploy a new one, evolve an existing one, or even create a boilerplate to write your own contracts!

To begin, clone the repo and install the packages:

```sh
# clone repo
git clone https://github.com/firstbatchxyz/hollowdb

# install packages
yarn
```

Our command-line tool can be called via `yarn contract`. You will see the message below if you type `yarn contract --help`:

```sh
yarn contract <command>

Commands:
  yarn contract evolve  Evolve an existing contract
  yarn contract deploy  Deploy a new contract
  yarn contract create  Create your own custom contract.
  yarn contract build   Build a contract.

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -w, --wallet        Path to Arweave wallet                            [string]
  -n, --name          Name of the contract.                             [string]
  -t, --target        Target network
                            [string] [choices: "main", "test"] [default: "main"]
  -s, --sourceTxId    Source transaction id                             [string]
  -c, --contractTxId  Contract transaction id                           [string]
```

## Building & Deploying & Evolving a Contract

As shown in the help message above, building, deploying, or evolving a contract is quite simple.

```sh
# build all contracts
yarn contract build

# build a specific contract
yarn contract build -n contract-name

# deploy to mainnet from a local source code
yarn contract deploy -w ./secret/wallet.json -n contract-name

# deploy to mainnet from an existing contract source
yarn contract deploy -w ./secret/wallet.json -s sourceTxId

# evolve a contract on mainnet to a local source code
yarn contract evolve -w ./secret/wallet.json -c contractTxId -n contract-name

# evolve a contract on mainnet to an existing contract source
yarn contract evolve -w ./secret/wallet.json -c contractTxId -s sourceTxId
```

Thanks to the file structure we are using here, you do not need to worry about paths to your contracts or their initial states. When you provide a contract name with `-n` option, the CLI knows to look for the contract source code at `./src/contracts/<name>.contract.ts` and such.

## Writing your own HollowDB Contract

A SmartWeave contract for Warp Contracts is basically a single JS file that exports a `handle` function. We write our contracts in TypeScript and then use [esbuild](https://esbuild.github.io/) to obtain the contract source code. The base HollowDB contract provides the necessary functions of a CRUD database, along with several admin operations such as changing the owner.

To begin creating your own contract, simply do:

```sh
yarn contract create -n your-new-contract
```

Within your newly created contract, you can modify the existing functions or add your own.

### Contract Functions

Each function in the contract is handled as a `case` of `switch-case`, and has the following structure:

```ts
case 'functionName': {
  const {/* inputs */} = await apply(caller, input.value, state, /* modifiers */);

  /* function logic */

  return {state};  // for write interactions; or,
  return {result}; // for read interactions
}
```

For example:

```ts
case 'updateOwner': {
  const {newOwner} = await apply(caller, input.value, state,
    // ensures caller is owner
    onlyOwner);

  // updates the owner
  state.owner = newOwner;

  // returns updated state
  return {state};
}
```

### Modifiers

The `apply` function is a utility that enables you to add modifiers to your function, just like Solidity modifiers. The first 3 arguments to `apply` must be the following:

- `caller` is like the `msg.sender` in Solidity, it is the wallet address that is making the interaction
- `input.value` is the input value of this interaction
- `state` is the current contract state

All of these are available at the top of the contract already, so you do not have to worry about preparing them. The remaining arguments are modifiers, which always take three arguments:

- **caller**: a string that represents address of the caller account, similar to `msg.sender`
- **input**: the input to this contract function
- **state**: contract state

Each modifier must return a value with the same type as `input`, it can be a Promise too. This way, each modifier does their thing to input values, and `apply` returns the final value; kind of like a `reduce` operation.

Let us look at the `onlyOwner` modifier that is used in the example:

```ts
export const onlyOwner = <I, S extends ContractState>(caller: string, input: I, state: S) => {
  if (caller !== state.owner) {
    throw NotOwnerError;
  }
  return input;
};
```

We provide the generic parameters so that TypeScript can infer the `input` type depending on which function we are implementing. Writing your own modifiers is a great way to change the functionality of existing contracts.

### Adding a Custom Function

When you are adding a new function, you may notice that TypeScript will give errors to your newly added `case`. This is because it is not yet registered as a contract input for the `handle` function yet. All the functions at the start are defined by default within the `ContractHandle` type; to define our own inputs we must pass them to the handle type.

For example, let's say we have a function `foo` with a number input and `bar` with some other input:

```ts
type FooInput = {
  function: 'foo';
  value: number;
};
type BarInput = {
  function: 'bar';
  value: {
    barbar: string;
  };
};
```

We can give these inputs as the third argument to our `ContractHandle` type:

```ts
export const handle: ContractHandle<Value, Mode, FooInput | BarInput> = async (state, input) => {
  // ...
};
```

Now you can add the respective cases without any type errors, and also type-inference will understand the type of your `input.value` based on which case you are handling!

> When `esbuild` builds the contract, it will put all necessary files within the build file. If you are using an NPM package within your contract, the entire package will be written into the output! This will cause the contract to be unreadable with huge lines of code. To avoid this issue, simply try to be 0-dependency, or use [Warp Plugins](https://academy.warp.cc/docs/sdk/advanced/plugins/overview) if convenient.

### Building your Contract

When you are done writing the contract, you can build it

## Extending the SDK

If you've added new contract functions, and would like to be able to call them using the HollowDB SDK, you have to extend the SDK with your custom functions.

HollowDB provides a `BaseSDK` which implement all core functionalities. To make them type-safe, we provide the template parameters. As an example, here is the actual HollowDB SDK class:

```ts
import {SDK as BaseSDK} from './base';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update']};

export class SDK<V = unknown> extends BaseSDK<V, Mode> {}
```

By providing the `Mode` type, we get type-safety for our whitelist names and circuit names; and, we provide the option to define a type for the values `V` to be stored in the database.

Let's consider the `FooInput` example from above:

```ts
type FooInput = {
  function: 'foo';
  value: number;
};
```

We can handle this function as we extend the `BaseSDK`:

```ts
import {SDK as BaseSDK} from './base';

type Mode = {
  /* your contract mode, if you have any */
};

export class FooSDK<V = unknown> extends BaseSDK<V, Mode> {
  async foo(value: number) {
    return this.base.dryWriteInteraction<FooInput>({
      function: 'foo',
      value,
    });
  }
}
```

## Folder Structure

Within this directory:

- `errors` contain errors that we may throw within the contract.
- `modifiers` contain custom logic that is executed before a function within the smart contract, similar to [Solidity function modifiers](https://docs.soliditylang.org/en/v0.8.21/contracts.html#function-modifiers).
- `states` has the initial state for each contract.
- `types` has types, as usual in TypeScript.
- `utils` has common utility functions, such as proof verification.
- the remaining files with `.contract.ts` extension are the smart-contracts, and when you run `yarn contract:build` they will be detected and built.
