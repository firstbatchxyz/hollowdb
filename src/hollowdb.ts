import {SDK as BaseSDK, Admin as BaseAdmin} from './base';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update']};
export class SDK<V = unknown> extends BaseSDK<V, Mode> {}
export class Admin<V = unknown> extends BaseAdmin<V, Mode> {}

type FooInput = {
  function: 'foo';
  value: number;
};
class FooSDK<V = unknown> extends BaseSDK<V, Mode> {
  async foo(value: number) {
    return this.dryWriteInteraction<FooInput>({
      function: 'foo',
      value,
    });
  }
}
