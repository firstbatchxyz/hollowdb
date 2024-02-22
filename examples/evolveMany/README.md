# Evolve Many

Sometimes, you will have multiple HollowDB contracts and you would like to evolve all of them to a newer version. Doing this via the CLI in HollowDB may be cumbersome, especially for a large number of contracts.

## Installation

This script only makes use Warp and Chalk (for nice outputs), install them via:

```sh
yarn install
```

## Usage

The main script is `index.js`, to configure the script you must:

- Specify the contracts to be evolved as an array within [contract.js](./contracts.js)
- Provide the source txID for the new contract source code, within [index.js](./index.js)
- Provide a path to the wallet that is the owner of all these contracts, again within [index.js](./index.js)

With these configured, simply:

```sh
yarn evolve
```
