import {InteractionResult, WriteInteractionResponse} from 'warp-contracts';
import {HollowDBInput, HollowDBState} from '../contracts/hollowDB/types';
import {Base} from './base';

/**
 * HollowDB function wrappers, exposing basic key-value database
 * functions.
 *
 * ```ts
 * const hollowdb = new SDK<YourValueType>(...)
 * hollowd.put(key, value)
 * hollowd.get(key)
 * hollowd.update(key, value, proof?)
 * hollowd.remove(key, proof?)
 * ```
 *
 * For more fine-grained control over the underlying control,
 * the SDK also exposes the following:
 *
 * ```ts
 * hollowdb.dryWrite(input)         // write on local state
 * hollowdb.writeInteraction(input) // write on updated state
 * hollowdb.readState()             // read contract state
 * ```
 */
export class SDK<V = unknown> extends Base {
  /**
   * Gets the value of the given key.
   * @param key the key of the value to be returned
   * @returns the value of the given key
   */
  async get(key: string): Promise<V> {
    const response = await this.hollowDB.viewState<HollowDBInput, V>({
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
    return await this.hollowDB.getStorageValues(keys);
  }

  /**
   * Returns all the keys in the database
   * @returns an array of all the keys in the database
   */
  async getAllKeys(): Promise<string[]> {
    const response = await this.hollowDB.viewState<HollowDBInput, string[]>({
      function: 'getAllKeys',
      data: {},
    });
    if (response.type !== 'ok') {
      throw new Error('Contract Error [getAllKeys]: ' + response.errorMessage);
    }
    return response.result;
  }

  /**
   * Return the latest contract state.
   * @returns contract state
   */
  async readState() {
    return await this.hollowDB.readState();
  }

  /**
   * A typed wrapper around `dryWrite`, which evaluates a given input
   * on the local state, without creating a transaction. This may provide
   * better UX for some use-cases.
   * @param input input in the form of `{function, data}`
   * @returns interaction result
   */
  async dryWrite(input: HollowDBInput): Promise<InteractionResult<HollowDBState, unknown>> {
    return await this.hollowDB.dryWrite<HollowDBInput>(input);
  }

  /**
   * A typed wrapper around `writeInteraction`, which creates a
   * transaction. You are likely to use this after `dryWrite`, or you
   * may directly call this function.
   * @param input input in the form of `{function, data}`
   * @returns interaction response
   */
  async writeInteraction(input: HollowDBInput): Promise<WriteInteractionResponse | null> {
    return await this.hollowDB.writeInteraction<HollowDBInput>(input);
  }

  /**
   * Inserts the given value into database.
   * @param key the key of the value to be inserted
   * @param value the value to be inserted
   */
  async put(key: string, value: V): Promise<void> {
    const input: HollowDBInput = {
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
    const input: HollowDBInput = {
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
    const input: HollowDBInput = {
      function: 'remove',
      data: {
        key,
        proof,
      },
    };
    const result = await this.hollowDB.dryWrite(input);
    if (result.type !== 'ok') {
      throw new Error('Contract Error [remove]: ' + result.errorMessage);
    }
    await this.writeInteraction(input);
  }
}
