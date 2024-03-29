import {BaseSDK} from '.';
import {SetInput, SetManyInput, SetStateInput} from './contracts/hollowdb-set.contract';

/** Just like HollowDB SDK, but supports `Set` and `SetMany` operations.
 * The user must be whitelisted for `set` separately to use them.
 *
 * A `set` operation is like a `put` but the key can exist already and will be overwritten.
 */
export class SetSDK<V = unknown> extends BaseSDK<V, {proofs: ['auth']; whitelists: ['put', 'update', 'set']}> {
  /**
   * Inserts the given value into database.
   *
   * Overwrites the existing values at the given key.
   *
   * @param key the key of the value to be inserted
   * @param value the value to be inserted
   */
  async set(key: string, value: V): Promise<void> {
    await this.base.dryWriteInteraction<SetInput<V>>({
      function: 'set',
      value: {
        key,
        value,
      },
    });
  }

  /**
   * Inserts an array of value into database.
   *
   * Overwrites the existing values at the given keys.
   *
   * @param keys the keys of the values to be inserted
   * @param values the values to be inserted
   */
  async setMany(keys: string[], values: V[]): Promise<void> {
    await this.base.dryWriteInteraction<SetManyInput<V>>({
      function: 'setMany',
      value: {
        keys,
        values,
      },
    });
  }

  /**
   * Overwrites the contract state.
   *
   * Note that this is an owner-only operation, and a wrongfully
   * overwritten state may break some of the contract methods.
   *
   * @param state the key of the value to be inserted
   */
  async setState(state: Awaited<ReturnType<this['getState']>>): Promise<void> {
    await this.base.dryWriteInteraction<SetStateInput>({
      function: 'setState',
      value: state,
    });
  }
}
