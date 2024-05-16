import {randomBytes} from 'crypto';
import {valueToBigInt, verifyProof} from '../utilities';

const REGION = 'eu-central-1';
const PROVIDER = 'aws';
const API_VER = 'v0';
const BASE_URL = `https://${PROVIDER}-${REGION}.hollowdb.xyz/db/${API_VER}`;

const DB: Record<string, unknown> = {};

/** A mocked fetch call, acting like the DB backend. */
export const mockFetchDB = jest.fn(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();

    // mock auth call
    if (url.startsWith('https://auth.firstbatch.xyz/hollow/create_bearer')) {
      return {
        ok: true,
        json: async () => ({bearerToken: randomBytes(32).toString('hex')}),
      } as Response;
    }

    // mock write call, no refresh
    else if (
      url === `${BASE_URL}/put` ||
      url === `${BASE_URL}/update` ||
      url === `${BASE_URL}/remove`
    ) {
      if (init === undefined) {
        throw new Error('expected init');
      }

      const op = url.slice(`${BASE_URL}/`.length);
      const body = JSON.parse(init.body as string);

      switch (op) {
        case 'put':
          DB[body.key] = body.value;
          break;
        case 'update':
          if (body.proof) {
            verifyProof(body.proof, [
              valueToBigInt(DB[body.key]),
              valueToBigInt(body.value),
              BigInt(body.key),
            ]);
          }

          DB[body.key] = body.value;
          break;
        case 'remove':
          if (body.proof) {
            verifyProof(body.proof, [
              valueToBigInt(DB[body.key]),
              BigInt(0),
              BigInt(body.key),
            ]);
          }

          delete DB[body.key];
          break;
        default:
          throw new Error('unexpected op: ' + op);
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({message: ''}),
      } as Response;
    }

    // mock read call, no refresh
    else if (url.startsWith(`${BASE_URL}/get/`)) {
      const key = url.slice(`${BASE_URL}/get/`.length);
      const decodedKey = decodeURIComponent(key);
      const val = DB[decodedKey];
      return {
        ok: true,
        status: 200,
        json: async () => ({message: '', data: {result: val ? val : null}}),
      } as Response;
    }

    throw new Error('couldnt mock');
  }
);

/** A mocked fetch call, just answers get and refreshes a token. */
const NEW_AUTH_TOKEN = randomBytes(32).toString('hex');
let refreshed = false;
export const mockFetchGetRefresh = jest.fn(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();

    // mock auth call
    if (url.startsWith('https://auth.firstbatch.xyz/hollow/create_bearer')) {
      return {
        ok: true,
        json: async () => ({bearerToken: randomBytes(32).toString('hex')}),
      } as Response;
    }

    // mock get call with refresh
    else if (url.startsWith(`${BASE_URL}/get/`)) {
      if (refreshed) {
        if (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (init!.headers! as any)['authorization'] !==
          `Bearer ${NEW_AUTH_TOKEN}`
        ) {
          throw new Error('expected refreshed token');
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: '',
            data: {result: 'value'},
          }),
        } as Response;
      } else {
        refreshed = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: '',
            data: {result: 'value'},
            newBearer: NEW_AUTH_TOKEN,
          }),
        } as Response;
      }
    }

    throw new Error('couldnt mock');
  }
);

/** A mocked fetch call, just answers get and refreshes a token. */
let oldtoken: string;
let refreshed2 = false;
export const mockFetchGetExpire = jest.fn(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    // mock auth call
    if (url.startsWith('https://auth.firstbatch.xyz/hollow/create_bearer')) {
      return {
        ok: true,
        json: async () => ({
          bearerToken: randomBytes(32).toString('hex'),
        }),
      } as Response;
    }

    // mock get call with refresh
    else if (url.startsWith(`${BASE_URL}/get/`)) {
      if (refreshed2) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((init!.headers! as any)['authorization'] === `Bearer ${oldtoken}`) {
          throw new Error('expected refreshed token');
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: '',
            data: {result: 'value'},
          }),
        } as Response;
      } else {
        refreshed2 = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oldtoken = (init!.headers! as any)['authorization'];
        return {
          ok: true,
          status: 403, // should be != 200
          json: async () => ({
            message: 'token expired', // this will trigger a token refresh
            data: {result: 'value'},
          }),
        } as Response;
      }
    }

    throw new Error('couldnt mock');
  }
);
