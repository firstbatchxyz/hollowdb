import {Base} from './base';
import {Admin} from './admin';
import type {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';
import type {
  ContractMode,
  ContractState,
  GetInput,
  GetManyInput,
  GetKVMapInput,
  GetKeysInput,
  PutInput,
  PutManyInput,
  RemoveInput,
  UpdateInput,
} from '../contracts/types';
import type {ArWallet, Contract, CustomSignature, SortKeyCacheResult, Warp} from 'warp-contracts';

export class SDK<V = unknown, M extends ContractMode = ContractMode> {
  readonly base: Base<M>;
  readonly admin: Admin<M>;

  /**
   * Connects to the given contract via the provided Warp instance using the provided signer.
   * @param signer a Signer, such as Arweave wallet or Ethereum CustomSignature
   * @param contractTxId contract txId to connect to
   * @param warp a Warp instace, such as `WarpFactory.forMainnet()`
   */
  constructor(signer: ArWallet | CustomSignature, contractTxId: string, warp: Warp) {
    this.base = new Base(signer, contractTxId, warp);
    this.admin = new Admin(this.base);
  }

  /** The smart-contract that we are connected to. */
  get contract(): Contract<ContractState<M>> {
    return this.base.contract;
  }

  /** Warp instance. */
  get warp(): Warp {
    return this.base.warp;
  }

  /** Contract transaction id. */
  get contractTxId(): string {
    return this.base.contract.txId();
  }

  /** Signer. */
  get signer(): ArWallet | CustomSignature {
    return this.base.signer;
  }

  /**
   * Returns the latest contract state.
   *
   * For a more fine-grained state data, use `base.readState()`.
   *
   * @returns contract state object
   */
  async getState(): Promise<ContractState<M>> {
    return await this.base.readState().then(s => s.cachedValue.state);
  }

  /**
   * Alternative method of getting key values. Uses the underlying `getStorageValues`
   * function, returns a Map instead of an array.
   *
   * @param keys an array of keys
   * @returns `SortKeyCacheResult` of a key-value `Map`
   */
  async getStorageValues(keys: string[]): Promise<SortKeyCacheResult<Map<string, V | null>>> {
    return (await this.contract.getStorageValues(keys)) as SortKeyCacheResult<Map<string, V | null>>;
  }

  /**
   * Returns keys with respect to a range option.
   *
   * If no option is provided, it will get all keys.
   *
   * @param options optional range
   * @returns an array of keys
   */
  async getKeys(options?: SortKeyCacheRangeOptions): Promise<string[]> {
    return await this.base.safeReadInteraction<GetKeysInput, string[]>({
      function: 'getKeys',
      value: {
        options,
      },
    });
  }

  /**
   * Returns all keys in the database.
   *
   * @returns an array of all keys
   */
  async getAllKeys(): Promise<string[]> {
    return this.getKeys();
  }

  /**
   * Returns a mapping of keys and values with respect to a range option.
   * If no option is provided, all values are returned.
   *
   * @param options optional range
   * @returns a key-value `Map`
   */
  async getKVMap(options?: SortKeyCacheRangeOptions): Promise<Map<string, V | null>> {
    return await this.base.safeReadInteraction<GetKVMapInput, Map<string, V>>({
      function: 'getKVMap',
      value: {
        options,
      },
    });
  }

  /**
   * Gets the value of the given key.
   * @param key the key of the value to be returned
   * @returns the value of the given key
   */
  async get(key: string): Promise<V | null> {
    return await this.base.safeReadInteraction<GetInput, V>({
      function: 'get',
      value: {
        key,
      },
    });
  }

  /**
   * Gets the values at the given keys as an array.
   *
   * If a value does not exist, it is returned as `null`.
   *
   * Note that the transaction limit may become a problem for too many keys.
   *
   * @param keys an array of keys
   * @returns an array of corresponding values
   */
  async getMany(keys: string[]): Promise<(V | null)[]> {
    return await this.base.safeReadInteraction<GetManyInput, (V | null)[]>({
      function: 'getMany',
      value: {
        keys,
      },
    });
  }

  /**
   * Inserts the given value into database.
   *
   * There must not be a value at the given key.
   *
   * @param key the key of the value to be inserted
   * @param value the value to be inserted
   */
  async put(key: string, value: V): Promise<void> {
    await this.base.dryWriteInteraction<PutInput<V>>({
      function: 'put',
      value: {
        key,
        value,
      },
    });
  }

  /**
   * Inserts an array of value into database.
   *
   * There must not be a value at the given key.
   *
   * @param keys the keys of the values to be inserted
   * @param values the values to be inserted
   */
  async putMany(keys: string[], values: V[]): Promise<void> {
    await this.base.dryWriteInteraction<PutManyInput<V>>({
      function: 'putMany',
      value: {
        keys,
        values,
      },
    });
  }

  /**
   * Updates the value of given key.
   * @param key key of the value to be updated
   * @param value new value
   * @param proof optional zero-knowledge proof
   */
  async update(key: string, value: V, proof?: object): Promise<void> {
    await this.base.dryWriteInteraction<UpdateInput<V>>({
      function: 'update',
      value: {
        key,
        value,
        proof,
      },
    });
  }

  /**
   * Removes the value of given key along with the key.
   * Checks if the proof is valid.
   * @param key key of the value to be removed
   * @param proof optional zero-knowledge proof
   */
  async remove(key: string, proof?: object): Promise<void> {
    await this.base.dryWriteInteraction<RemoveInput>({
      function: 'remove',
      value: {
        key,
        proof,
      },
    });
  }
}
