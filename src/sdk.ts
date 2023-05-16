import {HollowDBInput} from '../contracts/hollowDB/types';
import {Base} from './base';

/**
 * HollowDB function wrappers, exposing basic key-value database
 * functions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SDK<V = unknown> extends Base {
  /**
   * Returns the value of the given key.
   * @param key The key of the value to be returned.
   * @returns The value of the given key.
   */
  async get(key: string) {
    const response = await this.hollowDB.viewState<HollowDBInput>({
      function: 'get',
      data: {
        key: key,
      },
    });

    if (response.type !== 'ok') {
      throw new Error('Contract Error [get]: ' + response.errorMessage);
    }

    return response.result as V;
  }

  /**
   * Returns the values of the given keys.
   * @param keys The keys of the values to be returned.
   * @returns The values of the given keys.
   */
  async getMany(keys: string[]): Promise<V[]> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  /**
   * Alternative method of getting key values.
   * Uses the underlying `getStorageValues` function.
   * @param keys The keys of the values to be returned.
   * @returns The values of the given keys.
   */
  async getStorageValues(keys: string[]) {
    return this.hollowDB.getStorageValues(keys);
  }

  /**
   * Inserts the given value into database.
   * @param key The key of the value to be inserted.
   * @param value The value to be inserted.
   */
  async put(key: string, value: V) {
    const result = await this.hollowDB.dryWrite<HollowDBInput>({
      function: 'put',
      data: {
        key: key,
        value: '', // arbitrary mock data
      },
    });

    if (result.type !== 'ok') {
      throw new Error('Contract Error [put]: ' + result.errorMessage);
    }

    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'put',
      data: {
        key: key,
        value: value,
      },
    });
  }

  /**
   * Updates the value of given key.
   * @param key key of the value to be updated
   * @param value new value
   * @param proof proof of preimage knowledge of the key
   */
  async update(key: string, value: V, proof: object = {}) {
    const result = await this.hollowDB.dryWrite<HollowDBInput>({
      function: 'update',
      data: {
        key: key,
        value: value,
        proof: proof,
      },
    });

    if (result.type !== 'ok') {
      throw new Error('Contract Error [update]: ' + result.errorMessage);
    }

    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'update',
      data: {
        key: key,
        value: value,
        proof: proof,
      },
    });
  }

  /**
   * Removes the value of given key along with the key.
   * Checks if the proof is valid.
   * @param key The key of the value to be removed.
   * @param proof Proof of the value to be removed.
   */
  async remove(key: string, proof: object = {}) {
    const result = await this.hollowDB.dryWrite<HollowDBInput>({
      function: 'remove',
      data: {
        key: key,
        proof: proof,
      },
    });

    if (result.type !== 'ok') {
      throw new Error('Contract Error [remove]: ' + result.errorMessage);
    }

    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'remove',
      data: {
        key: key,
        proof: proof,
      },
    });
  }

  /**
   * Returns all the keys in the database
   * @returns An array of all the keys in the database
   */
  async getAllKeys(): Promise<string[]> {
    const response = await this.hollowDB.viewState<HollowDBInput>({
      function: 'getAllKeys',
      data: {},
    });

    if (response.type !== 'ok') {
      throw new Error('Contract Error [getAllKeys]: ' + response.errorMessage);
    }

    return response.result as string[];
  }

  /**
   * Return the latest contract state.
   * @returns contract state
   */
  async readState() {
    return await this.hollowDB.readState();
  }
}
