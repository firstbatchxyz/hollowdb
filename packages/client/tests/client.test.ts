import {randomBytes} from 'crypto';
import {computeKey, Prover} from 'hollowdb-prover';
import {HollowClient} from '../src';
import {mockFetchDB} from './mocks';

type ValueType = {
  test: number;
  foo: string;
};

// we can add plonk here too, but note that it has HUGE prover time
([undefined, 'groth16', 'plonk'] as const).map(protocol =>
  describe(`client ${
    protocol ? `(protocol: ${protocol})` : '(not zk)'
  }`, () => {
    let client: HollowClient<ValueType>;

    const prover = protocol
      ? new Prover(
          `./tests/circuits/hollow-authz-${protocol}/hollow-authz.wasm`,
          `./tests/circuits/hollow-authz-${protocol}/prover_key.zkey`,
          protocol
        )
      : undefined;
    const PREIMAGE = BigInt('0x' + randomBytes(16).toString('hex'));
    const KEY = protocol ? computeKey(PREIMAGE) : 'my lovely testing key';
    const values: ValueType[] = Array.from({length: 2}, () => ({
      test: Math.random() * 99,
      foo: randomBytes(4).toString('hex'),
    }));

    beforeAll(async () => {
      global.fetch = mockFetchDB;

      client = await HollowClient.new({
        apiKey: randomBytes(32).toString('hex'),
        db: 'testing',
      });
    });

    it('should put value', async () => {
      expect(await client.get(KEY)).toEqual(null);
      await client.put(KEY, values[0]);
      expect(await client.get(KEY)).toEqual(values[0]);
    });

    it('should update values', async () => {
      for (let i = 1; i < values.length; i++) {
        const {proof} = protocol
          ? await prover!.prove(PREIMAGE, values[i - 1], values[i])
          : {proof: undefined};

        expect(await client.get(KEY)).toEqual(values[i - 1]);
        await client.update(KEY, values[i], proof);
        expect(await client.get(KEY)).toEqual(values[i]);
      }
    });

    it('should remove value', async () => {
      const {proof} = protocol
        ? await prover!.prove(PREIMAGE, values[values.length - 1], null)
        : {proof: undefined};

      expect(await client.get(KEY)).toEqual(values[values.length - 1]);
      await client.remove(KEY, proof);
      expect(await client.get(KEY)).toEqual(null);
    });

    afterAll(async () => {
      jest.clearAllMocks();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      // SnarkJS may attach curve_bn128 to global, but does not terminate it.
      if (global.curve_bn128) await global.curve_bn128.terminate();
    });
  })
);
