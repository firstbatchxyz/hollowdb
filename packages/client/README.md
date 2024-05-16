<p align="center">
  <img src="https://raw.githubusercontent.com/firstbatchxyz/hollowdb/master/logo.svg" alt="logo" width="142">
</p>

<p align="center">
  <h1 align="center">
    HollowDB Client
  </h1>
  <p align="center">
    <i>HollowDB client is the simplest way to use HollowDB, a decentralized & privacy-preserving key-value database.</i>
  </p>
</p>

<p align="center">
    <a href="https://opensource.org/licenses/MIT" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg">
    </a>
    <a href="https://www.npmjs.com/package/hollowdb-client" target="_blank">
        <img alt="NPM" src="https://img.shields.io/npm/v/hollowdb-client?logo=npm&color=CB3837">
    </a>
    <a href="https://docs.hollowdb.xyz/hollowdb/hollowdb-as-a-service" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/docs-hollowdb-3884FF.svg?logo=gitbook">
    </a>
    <a href="./.github/workflows/test.yml" target="_blank">
        <img alt="Workflow: Tests" src="https://github.com/firstbatchxyz/hollowdb-client/actions/workflows/test.yml/badge.svg?branch=master">
    </a>
    <a href="https://github.com/firstbatchxyz/hollowdb" target="_blank">
        <img alt="GitHub: HollowDB" src="https://img.shields.io/badge/github-hollowdb-5C3EFE?logo=github">
    </a>
    <a href="https://discord.gg/2wuU9ym6fq" target="_blank">
        <img alt="Discord" src="https://dcbadge.vercel.app/api/server/2wuU9ym6fq?style=flat">
    </a>
</p>

## Installation

HollowDB client is an NPM package. You can install it as:

```sh
yarn add hollowdb-client    # yarn
npm install hollowdb-client # npm
pnpm add hollowdb-client    # pnpm
```

## Usage

Create a new API key and a database at <https://developer.hollowdb.xyz>. Create a new client by providing your API key and the database name to connect:

```ts
client = await HollowClient.new({
  apiKey: 'your-api-key',
  db: 'your-database-name',
});
```

After that, using the client is as simple as it gets:

```ts
// without zero-knowledge proofs
await client.get(KEY);
await client.put(KEY, VALUE);
await client.update(KEY, VALUE);
await client.remove(KEY);
```

If you are connecting to a database that has zero-knowledge proof verifications enabled, you will need to provide proofs along with your update & remove requests.

You can use our [HollowDB Prover](https://github.com/firstbatchxyz/hollowdb/packages/prover) utility to generate proofs with minimal development effort. Assuming that a proof is generated for the respective request, the proof shall be provided as an additional argument to these functions.

```ts
// with zero-knowledge proofs
await client.get(KEY);
await client.put(KEY, VALUE);
await client.update(KEY, VALUE, PROOF);
await client.remove(KEY, PROOF);
```

## Testing

To run tests:

```sh
yarn test
```

The API calls are mocked during the test, so you can run it offline.
