<p align="center">
  <img src="./logo.svg" alt="logo" width="142">
</p>

<p align="center">
  <h1 align="center">
    HollowDB
  </h1>
  <p align="center">
    <i>HollowDB is a decentralized privacy-preserving key-value database on Arweave network, powered by Warp Contracts.</i>
  </p>
</p>

<p align="center">
    <a href="https://opensource.org/licenses/MIT" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg">
    </a>
    <a href="https://www.npmjs.com/package/hollowdb" target="_blank">
        <img alt="NPM" src="https://img.shields.io/npm/v/hollowdb?logo=npm&color=CB3837">
    </a>
    <a href="https://docs.hollowdb.xyz" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/docs-hollowdb-3884FF.svg?logo=gitbook">
    </a>
    <a href="./.github/workflows/test.yml" target="_blank">
        <img alt="Workflow: Tests" src="https://github.com/firstbatchxyz/hollowdb/actions/workflows/test.yml/badge.svg?branch=master">
    </a>
    <a href="./.github/workflows/build.yml" target="_blank">
        <img alt="Workflow: Styles" src="https://github.com/firstbatchxyz/hollowdb/actions/workflows/build.yml/badge.svg?branch=master">
    </a>
    <a href="https://discord.gg/2wuU9ym6fq" target="_blank">
        <img alt="Discord" src="https://dcbadge.vercel.app/api/server/2wuU9ym6fq?style=flat">
    </a>
</p>

## Installation

To install HollowDB:

```bash
yarn add hollowdb     # yarn
npm install hollowdb  # npm
pnpm add hollowdb     # pnpm
```

## Usage

You can read the full documentation at <https://docs.hollowdb.xyz>.

## Testing

You can run all tests via:

```sh
yarn test
```

Tests operate on a local Arweave instance using [ArLocal](https://www.npmjs.com/package/arlocal). They will run for all cache types (LMDB, Redis, LevelDB). You will need to have a Redis server running for some of the tests to pass, the URL shall be specified [here](./tests/constants/index.ts).

The tests are as follows:

- `evolve` tests for evolve functionality.
- `whitelists` tests for Whitelist functionality, both enabled and disabled.
- `proofs` tests for Proofs functionality, both enabled and disabled.
- `crud` tests for basic CRUD functionality, such as checking for existing keys, not removing an already removed key and such.
- `htx` tests use a custom contract where assume Bundlr usage and instead of values themselves, we store `valueHash.txid` as values.
- `multi` tests using a single Warp instance with multiple contracts, and multiple HollowDB instances.

## Styling

We are using the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

```sh
yarn format # prettier
yarn lint   # eslint
```
