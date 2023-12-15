# HollowDB Micro

This backend implementation uses [Micro](https://github.com/vercel/micro) which is a very lightweight server for NodeJS by Vercel, tailored towards usage within a container & supports Unix Domain Socket. It supports almost the CRUD operations as exposed by HollowDB.

## Usage

First, you need an Arweave wallet. Provide the path to the wallet with the `WALLET_PATH` environment variable.

> [!NOTE]
>
> By convention you can put your wallet under the `config` folder as `wallet.json`, which is where the server will look for if no path is specified:
>
> ```sh
> cat your-wallet.json > ./config/wallet.json
> ```

Then, install the packages.

```sh
yarn install
```

Finally, start the server with:

```sh
CONTRACT_TXID="your-contract" yarn start
```

### Configurations

There are several environment variables to configure the server. You can provide them within the command line, or via `.env` file. An example is given [here](./.env.example).

- `WALLET_PATH=path/to/wallet.json` <br> HollowDB requires an Arweave wallet, specified by this variable. If none is given, it defaults to `./config/wallet.json`.

- `REDIS_URL=<redis-url>` <br> You need a Redis server running before you start the server, the URL to the server can be provided with a `REDIS_URL` environment variable. The connection URL defaults to `redis://default:redispw@localhost:6379`.

- `WARP_LOG_LEVEL=<log-level>` <br> By default Warp will log at `info` level, but you can change it via the `WARP_LOG_LEVEL` environment variable. Options are the known levels of `debug`, `error`, `fatal`, `info`, `none`, `silly`, `trace` and `warn`.

### Changing the Address

The listened address defaults to `0.0.0.0:3000`, and this can be overridden via `-l` option.

```sh
# listen to another TCP endpoint
yarn start -l tcp://hostname:port

# listen to UNIX Domain Socket (more performant)
yarn start -l unix:/path/to/socket.sock
```

## Endpoints

Due to how tiny [Micro](https://github.com/vercel/micro) is, it does not come with routing; so we instead provide the `route` within the POST body. The interface for the POST body, along with the interface of returned data if there is one, is provided below.

- [`GET`](#get)
- [`GET_MANY`](#get_many)
- [`PUT`](#put)
- [`PUT_MANY`](#put_many)
- [`UPDATE`](#update)
- [`REMOVE`](#remove)
- [`STATE`](#state)

### `GET`

```ts
interface {
  route: "GET",
  data: {
    key: string
  }
}

// response body
interface {
  value: any
}
```

Returns the value at the given key.

> [!TIP]
>
> Alternatively, any HTTP GET request with a non-empty URI is treated as a key query, where the URI represents the key. For example, a GET request at `http://localhost:3000/key-name` returns the value stored at key `key-name`.

### `GET_MANY`

```ts
interface {
  route: "GET_MANY",
  data: {
    keys: string[]
  }
}

// response body
interface {
  values: any[]
}
```

Returns the values at the given `keys`.

### `PUT`

```ts
interface {
  route: "PUT",
  data: {
    key: string,
    value: any
  }
}
```

Puts `value` at the given `key`. The key must not exist already, or it must have `null` stored at it.

### `PUT_MANY`

```ts
interface {
  route: "PUT_MANY",
  data: {
    keys: string[],
    values: any[]
  }
}
```

Updates given `keys` with the provided `values`. No key must exist already in the database.

### `UPDATE`

```ts
interface {
  route: "UPDATE",
  data: {
    key: string,
    value: any,
    proof?: object
  }
}
```

Updates a `key` with the provided `value` and an optional `proof`.

### `REMOVE`

```ts
interface {
  route: "REMOVE",
  data: {
    key: string,
    proof?: object
  }
}
```

Removes the value at `key`, along with an optional `proof`.

### `STATE`

```ts
interface {
  route: "STATE"
}
```

Syncs & fetches the latest contract state, and returns it.
