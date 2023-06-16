import {Base} from './base';
import type {ContractInput} from '../contracts/common/types/contract';
import type {SortKeyCacheRangeOptions} from 'warp-contracts/lib/types/cache/SortKeyCacheRangeOptions';

export class SDK<V = unknown> extends Base {
  /**
   * Gets the values of the given keys.
   * @param keys an array of keys
   * @returns the values of the given keys
   */
  async getMany(keys: string[]): Promise<V[]> {
    return await Promise.all(keys.map(key => this.get(key)));
  }

  /**
   * Alternative method of getting key values.
   * Uses the underlying `getStorageValues` function.
   * @param keys the keys of the values to be returned
   * @returns the values of the given keys
   */
  async getStorageValues(keys: string[]) {
    return await this.contract.getStorageValues(keys);
  }

  /**
   * Returns all the keys in the database
   * @returns an array of all the keys in the database
   */
  async getAllKeys(): Promise<string[]> {
    return this.getKeys();
  }

  /**
   * Returns keys with respect to a range option. If no option is provided,
   * this function is equivalent to {@link getAllKeys}.
   */
  async getKeys(options?: SortKeyCacheRangeOptions): Promise<string[]> {
    const response = await this.viewState<string[]>({
      function: 'getKeys',
      data: {
        options,
      },
    });
    if (response.type !== 'ok') {
      throw new Error('Contract Error [getKeys]: ' + response.errorMessage);
    }
    return response.result;
  }

  /**
   * Returns a mapping of keys and values with respect to a range option. If no option is provided,
   * all values are returned.
   */
  async getKVMap(options?: SortKeyCacheRangeOptions): Promise<Map<string, V>> {
    const response = await this.viewState<Map<string, V>>({
      function: 'getKVMap',
      data: {
        options,
      },
    });
    if (response.type !== 'ok') {
      throw new Error('Contract Error [getKVMap]: ' + response.errorMessage);
    }
    return response.result;
  }

  /**
   * Gets the value of the given key.
   * @param key the key of the value to be returned
   * @returns the value of the given key
   */
  async get(key: string): Promise<V> {
    const response = await this.viewState<V>({
      function: 'get',
      data: {
        key,
      },
    });
    if (response.type !== 'ok') {
      throw new Error('Contract Error [get]: ' + response.errorMessage);
    }
    return response.result;
  }

  /**
   * Inserts the given value into database.
   * @param key the key of the value to be inserted
   * @param value the value to be inserted
   */
  async put(key: string, value: V): Promise<void> {
    const input: ContractInput = {
      function: 'put',
      data: {
        key,
        value,
      },
    };
    const result = await this.dryWrite(input);
    if (result.type !== 'ok') {
      throw new Error('Contract Error [put]: ' + result.errorMessage);
    }
    await this.writeInteraction(input);
  }

  /**
   * Updates the value of given key.
   * @param key key of the value to be updated
   * @param value new value
   * @param proof optional zero-knowledge proof
   */
  async update(key: string, value: V, proof: object = {}): Promise<void> {
    const input: ContractInput = {
      function: 'update',
      data: {
        key,
        value,
        proof,
      },
    };
    const result = await this.dryWrite(input);
    if (result.type !== 'ok') {
      throw new Error('Contract Error [update]: ' + result.errorMessage);
    }
    await this.writeInteraction(input);
  }

  /**
   * Removes the value of given key along with the key.
   * Checks if the proof is valid.
   * @param key key of the value to be removed
   * @param proof optional zero-knowledge proof
   */
  async remove(key: string, proof: object = {}): Promise<void> {
    const input: ContractInput = {
      function: 'remove',
      data: {
        key,
        proof,
      },
    };
    const result = await this.dryWrite(input);
    if (result.type !== 'ok') {
      throw new Error('Contract Error [remove]: ' + result.errorMessage);
    }
    await this.writeInteraction(input);
  }
}
