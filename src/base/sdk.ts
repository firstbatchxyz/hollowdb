import {Base} from './base';
import type {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';
import type {
  ContractMode,
  GetInput,
  GetKVMapInput,
  GetKeysInput,
  PutInput,
  RemoveInput,
  UpdateInput,
} from '../contracts/types';

export class BaseSDK<V = unknown, M extends ContractMode = {whitelists: []; circuits: []}> extends Base<M> {
  /** Gets the values at the given keys as an array. */
  async getMany(keys: string[]): Promise<V[]> {
    return await Promise.all(keys.map(key => this.get(key)));
  }

  /**
   * Alternative method of getting key values.
   *
   * Uses the underlying `getStorageValues` function, returns a Map instead of
   * an array.
   */
  async getStorageValues(keys: string[]) {
    return await this.contract.getStorageValues(keys);
  }

  /** Returns all the keys in the database. */
  async getAllKeys(): Promise<string[]> {
    return await this.getKeys();
  }

  /**
   * Returns keys with respect to a range option. If no option is provided,
   * this function is equivalent to {@link getAllKeys}.
   */
  async getKeys(options?: SortKeyCacheRangeOptions): Promise<string[]> {
    return await this.safeReadInteraction<GetKeysInput, string[]>(
      {
        function: 'getKeys',
        value: {
          options,
        },
      },
      'Contract Error [getKeys]: '
    );
  }

  /**
   * Returns a mapping of keys and values with respect to a range option. If no option is provided,
   * all values are returned.
   */
  async getKVMap(options?: SortKeyCacheRangeOptions): Promise<Map<string, V>> {
    return await this.safeReadInteraction<GetKVMapInput, Map<string, V>>(
      {
        function: 'getKVMap',
        value: {
          options,
        },
      },
      'Contract Error [getKVMap]: '
    );
  }

  /**
   * Gets the value of the given key.
   * @param key the key of the value to be returned
   * @returns the value of the given key
   */
  async get(key: string): Promise<V> {
    return await this.safeReadInteraction<GetInput, V>(
      {
        function: 'get',
        value: {
          key,
        },
      },
      'Contract Error [get]: '
    );
  }

  /**
   * Inserts the given value into database.
   * @param key the key of the value to be inserted
   * @param value the value to be inserted
   */
  async put(key: string, value: V): Promise<void> {
    await this.dryWriteInteraction<PutInput<V>>(
      {
        function: 'put',
        value: {
          key,
          value,
        },
      },
      'Contract Error [put]: '
    );
  }

  /**
   * Updates the value of given key.
   * @param key key of the value to be updated
   * @param value new value
   * @param proof optional zero-knowledge proof
   */
  async update(key: string, value: V, proof?: object): Promise<void> {
    await this.dryWriteInteraction<UpdateInput<V>>(
      {
        function: 'update',
        value: {
          key,
          value,
          proof,
        },
      },
      'Contract Error [update]: '
    );
  }

  /**
   * Removes the value of given key along with the key.
   * Checks if the proof is valid.
   * @param key key of the value to be removed
   * @param proof optional zero-knowledge proof
   */
  async remove(key: string, proof?: object): Promise<void> {
    await this.dryWriteInteraction<RemoveInput>(
      {
        function: 'remove',
        value: {
          key,
          proof,
        },
      },
      'Contract Error [remove]: '
    );
  }
}
