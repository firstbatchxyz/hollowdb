import {Base} from '../base';
import type {HollowDbSdkArgs} from '../types';

/**
 * HollowDB function wrappers, exposing basic key-value database
 * functions.
 */
export class SDK extends Base {
  constructor(args: HollowDbSdkArgs) {
    super(args);
  }

  /**
   * Returns the value of the given key.
   * @param key The key of the value to be returned.
   * @returns The value of the given key.
   */
  async get(key: string) {
    const response = await this.hollowDB.viewState({
      function: 'get',
      data: {
        key: key,
      },
    });

    if (response.type !== 'ok') {
      throw new Error('Contract Error [get]: ' + response.errorMessage);
    }

    return response.result;
  }

  /**
   * Returns the values of the given keys.
   * @param keys The keys of the values to be returned.
   * @returns The values of the given keys.
   */
  async getMany(keys: string[]) {
    return await Promise.all(
      keys.map(async key => {
        return await this.get(key);
      })
    );
  }

  /**
   * Inserts the given value into database.
   * @param key The key of the value to be inserted.
   * @param valueTx The valueTx to be inserted.
   */
  async put(key: string, valueTx: string) {
    const result = await this.hollowDB.dryWrite({
      function: 'put',
      data: {
        key: key,
        valueTx: '', // arbitrary mock data
      },
    });

    if (result.type !== 'ok') {
      throw new Error('Contract Error [put]: ' + result.errorMessage);
    }

    await this.hollowDB.writeInteraction({
      function: 'put',
      data: {
        key: key,
        valueTx: valueTx,
      },
    });
  }

  /**
   * Updates the value of given key.
   * @param key The key of the value to be updated.
   * @param value The new valueTx.
   * @param proof Proof of the value to be updated.
   */
  async update(key: string, valueTx: string, proof: object) {
    const result = await this.hollowDB.dryWrite({
      function: 'update',
      data: {
        key: key,
        valueTx: valueTx,
        proof: proof,
      },
    });

    if (result.type !== 'ok') {
      throw new Error('Contract Error [update]: ' + result.errorMessage);
    }

    await this.hollowDB.writeInteraction({
      function: 'update',
      data: {
        key: key,
        valueTx: valueTx,
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
  async remove(key: string, proof: object) {
    const result = await this.hollowDB.dryWrite({
      function: 'remove',
      data: {
        key: key,
        proof: proof,
      },
    });

    if (result.type !== 'ok') {
      throw new Error('Contract Error [remove]: ' + result.errorMessage);
    }

    await this.hollowDB.writeInteraction({
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
  async getAllKeys() {
    const contractValues = this.warp.kvStorageFactory(this.contractTxId);
    const keys = await contractValues.keys();
    await contractValues.close();
    return keys;
  }

  /**
   * Return the latest contract state.
   * @returns contract state
   */
  async readState() {
    return await this.hollowDB.readState();
  }
}
