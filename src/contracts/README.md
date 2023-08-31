# HollowDB Contracts

HollowDB itself is a SmartWeave contract. In particular, we use Warp Contracts which is like SmartWeave on steroids.

Within this directory:

- `errors` contain errors that we may throw within the contract.
- `modifiers` contain custom logic that is executed before a function within the smart contract, similar to [Solidity function modifiers](https://docs.soliditylang.org/en/v0.8.21/contracts.html#function-modifiers).
- `states` has the initial state for each contract.
- `types` has types, as usual in TypeScript.
- `utils` has common utility functions, such as proof verification.
- the remaining files with `.contract.ts` extension are the smart-contracts, and when you run `yarn contract:build` they will be detected and built.

## Writing your own HollowDB Contract

A SmartWeave contract for Warp Contracts is basically a single JS file that exports a `handle` function. We write our contracts in TypeScript and then use [esbuild](https://esbuild.github.io/) to obtain the contract source code. The base HollowDB contract provides the necessary functions of a CRUD database, along with several admin operations such as changing the owner.

To begin writing your own contract, duplicate `hollowdb.contract.ts` in this directory and change the name to `<your-contract-name>.contract.ts`.

There are two ways you can write your own contract:

- Change existing functions
- Add new functions

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
  const {newOwner} = await apply(caller, input.value, state, onlyOwner);

  state.owner = newOwner;

  return {state};
}
```

### Modifiers

The `apply` function is a utility that enables you to add modifiers to your function, just like Solidity modifiers. The first 3 arguments to `apply` must be the following:

- `caller` is like the `msg.sender` in Solidity, it is the wallet address that is making the interaction
- `input.value` is the input value of this interaction
- `state` is the current contract state

All of these are available at the top of the contract already, so you do not have to worry about preparing them. The remaining arguments are modifiers, that have the type:

```ts
(caller: string, input: I, state: S) => I | Promise<I>;
```

Basically, each modifier takes in three arguments as described above, and returns the same type as the input value. This way, each modifier does their thing to input values, and `apply` returns the final value; kind of like a `reduce` operation.

Let us look at the `onlyOwner` modifier that is used in the example:

```ts
export const onlyOwner = <I, S extends ContractState>(caller: string, input: I, state: S) => {
  if (caller !== state.owner) {
    throw NotOwnerError;
  }
  return input;
};
```

We provide the generic parameters so that TypeScript can infer the `input` type depending on which function we are implementing.

Writing your own modifiers is a great way to change the functionality of existing contracts.

### Adding a Custom Function

When you are adding a new function, you may notice that TypeScript will give errors to your newly added `case`. This is because it is not yet registered as a contract input for the `handle` function yet.

All the functions at the start are defined by default within the `ContractHandle` type; to define our own inputs we must pass them to the handle type.

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

Now you can add the respective `case`s without any type errors, and also type-inference will understand the type of your `input.value` based on which case you are handling!

### Caveats

When `esbuild` builds the contract, it will put all necessary files within the build file. If you are using an NPM package within your contract, the entire package will be written into the output! This will cause the contract to be unreadable with huge lines of code.

To avoid this issue, simply try to be 0-dependency, or use [Warp Plugins](https://academy.warp.cc/docs/sdk/advanced/plugins/overview) if convenient.

## Extending SDK

If you've added new contract functions, and would like to be able to call them using the HollowDB SDK, you have to extend the SDK with your custom functions.

HollowDB provides `BaseSDK` and `BaseAdmin` which implement all core functionalities without type-safety. To make them type-safe, we provide the template parameters. As an example, here is the actual HollowDB SDK and Admin classes:

```ts
import {SDK as BaseSDK, Admin as BaseAdmin} from './base';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update']};

export class SDK<V = unknown> extends BaseSDK<V, Mode> {}
export class Admin<V = unknown> extends BaseAdmin<V, Mode> {}
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
import {SDK as BaseSDK, Admin as BaseAdmin} from './base';

type Mode = /* your contract mode, if you have any */;

export class FooSDK<V = unknown> extends BaseSDK<V, Mode> {
  async foo(value: number) {
    return this.dryWriteInteraction<FooInput>({
      function: 'foo',
      value,
    });
  }
}
```

TODO: how to handle SDK and Admin together?
