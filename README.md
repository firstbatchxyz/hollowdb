<p align="center">
  <img src="https://raw.githubusercontent.com/firstbatchxyz/hollowdb/master/logo.svg" alt="logo" width="142">
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
        <img alt="Workflow: Build" src="https://github.com/firstbatchxyz/hollowdb/actions/workflows/build.yml/badge.svg?branch=master">
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

Depending on your use-cases, we have several optional dependencies:

- You can use [hollowdb-prover](https://www.npmjs.com/package/hollowdb-prover) as a simple utility that generates zero-knowledge proofs that are verifiable by HollowDB.
- You can use LMDB cache within your Warp instance via [warp-contracts-lmdb](https://www.npmjs.com/package/warp-contracts-lmdb).
- You can use Redis cache within your warp instance via [warp-contracts-redis](https://www.npmjs.com/package/warp-contracts-redis) together with [ioredis](https://www.npmjs.com/package/ioredis).

## Usage

You can read the full documentation of HollowDB at <https://docs.hollowdb.xyz>.

> [!NOTE]
>
> If you are interested in customizing the smart contract of HollowDB and extending its SDKs, refer to this [README](./src/contracts/README.md).

## Examples

Check out the [examples](./examples/) folder for a few examples of HollowDB usage:

- **Simple**: a single JS file that demonstrates getting & setting a key.
- **Micro**: a Vercel Micro backend that can serves HollowDB as API endpoints, useful when you want to use HollowDB from another language.

## Testing

You can run all tests via:

```sh
pnpm test
```

Tests operate on a local Arweave instance using [arlocal](https://www.npmjs.com/package/arlocal). They will run for all cache types (LMDB, Redis, LevelDB). You will need to have a Redis server running for some of the tests to pass, the URL shall be specified [here](./tests/constants/index.ts).

## Styling

You can check the formatting of the code or lint everything with the following commands:

```sh
pnpm format # prettier
pnpm lint   # eslint
```
