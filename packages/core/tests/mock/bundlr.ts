import {randomBytes} from 'crypto';

/** A Bundlr mocker, just upload and get values. */
export class MockBundlr<V = unknown> {
  private data: Record<string, V> = {};

  upload(value: V): string {
    const txId = randomBytes(32).toString('hex');
    this.data[txId] = value;
    return txId;
  }

  get(txId: string): V {
    if (!(txId in this.data)) {
      throw new Error();
    }
    return this.data[txId];
  }
}
