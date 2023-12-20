# Tests

The tests are as follows:

- `evolve` tests for evolve functionality.
- `whitelists` tests for Whitelist functionality, both enabled and disabled.
- `proofs` tests for Proofs functionality, both enabled and disabled.
- `crud` tests for basic CRUD functionality, such as checking for existing keys, not removing an already removed key and such.
- `htx` tests use a custom contract where assume Bundlr usage and instead of values themselves, we store `valueHash.txid` as values.
- `multi` tests using a single Warp instance with multiple contracts, and multiple HollowDB instances.
- `null` tests null values, which are not allowed due to ambiguity between a null value and non-existent value.
