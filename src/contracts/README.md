# HollowDB Contracts

HollowDB itself is a SmartWeave contract. In particular, we use Warp Contracts which is like SmartWeave on steroids.

## Folder Structure

First let us explore the folder structure here:

- `errors` folder contains errors that we may throw within the contract.
- `modifiers` folder contains custom logic that is executed before a function within the smart contract, similar to [Solidity function modifiers](https://docs.soliditylang.org/en/v0.8.21/contracts.html#function-modifiers).
- `states` folder has the initial state for each contract.
- `types` has types, as usual in TypeScript.
- `utils` has common utility functions.
- the remaining files with `.contract.ts` extension are contracts, and when you run `yarn contract:build` they will be detected and built!

## Writing your own HollowDB Contract

HollowDB contract itself has quite a bit of logic, ranging from whitelists to zero-knowledge proof verifications; and, provides basic CRUD operations along with several get methods like `getKeys` and `getKVMap`.

A SmartWeave contract for Warp Contracts is basically a single JS file that exports a `handle` function. We can write our contract in TypeScript and then use [esbuild](https://esbuild.github.io/) to obtain the contract source code.
