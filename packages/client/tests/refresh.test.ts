import {randomBytes} from 'crypto';
import {HollowClient} from '../src';
import {mockFetchGetExpire, mockFetchGetRefresh} from './mocks';

const KEY = 'my lovely key';

describe('token refresh due to new bearer', () => {
  let client: HollowClient;

  beforeAll(async () => {
    global.fetch = mockFetchGetRefresh; // mock fetch

    client = await HollowClient.new({
      apiKey: randomBytes(32).toString('hex'),
      db: 'testing',
    });
  });

  it('should refresh token due to new bearer in response', async () => {
    await client.get(KEY);

    // should not throw error if token is refreshed correctly
    await client.get(KEY);
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});

describe('token refresh due to expiration', () => {
  let client: HollowClient;

  beforeAll(async () => {
    global.fetch = mockFetchGetExpire; // mock fetch

    client = await HollowClient.new({
      apiKey: randomBytes(32).toString('hex'),
      db: 'testing',
    });
  });

  it('should refresh token due to expiration', async () => {
    await client.get(KEY);

    // should not throw error if token is refreshed correctly
    await client.get(KEY);
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
