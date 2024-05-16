import {getToken} from './utilities';

/**
 * To authenticate yourself, you need to provide the following:
 *
 * - `apiKey` belonging to your team.
 * - `db` database name to connect to.
 *
 * To create a new API key or a database, go to <https://developer.hollowdb.xyz/>
 */
export type HollowClientOptions = {
  apiKey: string;
  db: string;
  region?: string;
  provider?: string;
};

type BlockchainOption = {
  /**
   * Specify whether to store the value on blockchain (Arweave).
   *
   * If `undefined`, it defaults to storing the value on blockchain.
   */
  blockchain?: 'arweave' | 'none';
};

type ExpireOption = {
  /** Specify an expiration time (seconds) for your data. */
  expire?: number;
};

/**
 * **[HollowDB Client](https://docs.hollowdb.xyz/hollowdb/hollowdb-as-a-service#hollowdb-client)**
 *
 * HollowDB client provides a very simple interface, abstracting everything behind
 * the scenes. Create a new client with `new` static function:
 *
 * ```ts
 * const client = await HollowClient.new({
 *   apiKey: 'your-api-key',
 *   db: 'your-database-name',
 * });
 * ```
 *
 *
 * You can do the 4 basic CRUD operations as shown below:
 *
 * ```ts
 * await client.get(KEY);
 * await client.put(KEY, VALUE);
 * await client.update(KEY, VALUE);
 * await client.remove(KEY);
 * ```
 *
 * You can also do a multi-get:
 *
 * ```ts
 * await client.getMulti([KEY1, KEY2, ...]);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HollowClient<T = any> {
  protected readonly apiKey: string;
  protected readonly db: string;
  protected authToken: string;
  protected readonly apiVersion = 'v0';

  protected BASE_URL: string;

  // auth token is retrieved by the client code, so it is not provided within `opt`
  private constructor(opt: HollowClientOptions, authToken: string) {
    this.apiKey = opt.apiKey;
    this.authToken = authToken;
    this.db = opt.db;

    if (!opt.region) opt.region = 'eu-central-1';
    if (!opt.provider) opt.provider = 'aws';

    this.BASE_URL = `https://${opt.provider}-${opt.region}.hollowdb.xyz/db/${this.apiVersion}`;
    /** Base API url. */
  }

  /**
   * Creates & authenticates a HollowDB client.
   *
   * ```ts
   * type ValueType = {foo: number, bar: string};
   *
   * client = await HollowClient.new<ValueType>({
   *   apiKey: 'your-api-key',
   *   db: 'your-database-name',
   * });
   * ```
   *
   * You can provide a value type to the function to make all functions treat that type
   * as the value type for your key-value database.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async new<T = any>(
    options: HollowClientOptions
  ): Promise<HollowClient<T>> {
    const authToken = await getToken(options.db, options.apiKey);
    return new HollowClient<T>(options, authToken);
  }

  /**
   * **Returns the value at the given key.**
   *
   * This operation does not require proofs.
   *
   * If the key does not exist, `null` will be returned.
   */
  public async get(key: string): Promise<T | null> {
    const encodedKey = encodeURIComponent(key);
    const response = await this.fetch<{result: T | null}>(
      `${this.BASE_URL}/get/${encodedKey}`,
      'GET'
    );

    if (!response.data) {
      throw new Error('Expected data in response.');
    }

    return response.data.result;
  }

  /**
   * **Returns the value at the given keys.**
   *
   * This operation does not require proofs.
   *
   * The returned array is an array of values where `value[i]` is
   * belongs to `key[i]`. If a key does not exist, `null` is returned
   * for that key.
   */
  public async getMulti(keys: string[]): Promise<(T | null)[]> {
    const response = await this.fetch<{result: (T | null)[]}>(
      `${this.BASE_URL}/mget`,
      'POST',
      JSON.stringify({keys})
    );

    return response.data.result;
  }

  /**
   * **Puts a value at the given key.**
   *
   * The target key must be empty, i.e. this is not an upsert operation.
   *
   * This operation does not require proofs even if zero-knowledge is enabled.
   */
  public async put(
    key: string,
    value: T,
    options?: ExpireOption
  ): Promise<void>;
  public async put(
    key: string,
    value: T,
    options?: BlockchainOption
  ): Promise<void>;
  public async put(
    key: string,
    value: T,
    options?: ExpireOption | BlockchainOption
  ): Promise<void> {
    await this.fetch(
      `${this.BASE_URL}/put`,
      'POST',
      JSON.stringify({key, value, options})
    );
  }

  /**
   * **Puts an array of key-value pairs.**
   *
   * The target keys must be empty, i.e. this is not an upsert operation.
   *
   * This operation does not require proofs even if zero-knowledge is enabled.
   *
   * Returns an array of booleans that indicate whether each key-value pair has
   * been succesfully put or not.
   *
   */
  public async putMulti(
    pairs: {key: string; value: T; options?: ExpireOption}[]
  ): Promise<boolean[]>;
  public async putMulti(
    pairs: {key: string; value: T; options?: BlockchainOption}[]
  ): Promise<boolean[]>;
  public async putMulti(
    pairs: {key: string; value: T; options?: BlockchainOption | ExpireOption}[]
  ): Promise<boolean[]> {
    const response = await this.fetch<{result: boolean[]}>(
      `${this.BASE_URL}/mput`,
      'POST',
      JSON.stringify({pairs})
    );

    return response.data.result;
  }

  /** **Updates a value at the given key.**
   *
   * A zero-knowledge proof is optionally provided, which the service
   * expects if the connected database has proofs enabled.
   */
  public async update(
    key: string,
    value: T,
    proof?: object,
    options?: BlockchainOption
  ): Promise<void>;
  public async update(
    key: string,
    value: T,
    proof?: object,
    options?: ExpireOption
  ): Promise<void>;
  public async update(
    key: string,
    value: T,
    proof?: object,
    options?: BlockchainOption | ExpireOption
  ) {
    await this.fetch(
      `${this.BASE_URL}/update`,
      'POST',
      JSON.stringify({
        key,
        value,
        proof,
        options,
      })
    );
  }

  /** **Removes a value at the given key.**
   *
   * Subsequent `get` calls to this key shall return `null`.
   *
   * A zero-knowledge proof is optionally provided, which the service
   * expects if the connected database has proofs enabled.
   */
  public async remove(key: string, proof?: object, options?: BlockchainOption) {
    await this.fetch(
      `${this.BASE_URL}/remove`,
      'POST',
      JSON.stringify({
        key,
        proof,
        options,
      })
    );
  }

  /** Fetch utility for internal use. */
  private async fetch<Data = undefined>(
    url: string,
    method: 'GET' | 'POST',
    body?: BodyInit
  ): Promise<{
    message: string;
    data: Data;
    newBearer?: string;
  }> {
    const init: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        authorization: `Bearer ${this.authToken}`,
      },
      method,
    };
    if (body) init.body = body;

    const response = await fetch(url, init);
    const json = await response.json();

    if (response.status === 200) {
      // new bearer has been created due to expiration of previous bearer
      if (json.newBearer !== undefined) {
        this.authToken = json.newBearer;
      }
      return json;
    } else if (json.message === 'token expired') {
      // token has expired, client must initiate the new token request
      this.authToken = await getToken(this.db, this.apiKey);
      return json;
    }

    throw new Error(`${url} got status ${response.status}: ${json.message}`);
  }
}
