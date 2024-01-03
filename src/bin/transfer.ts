import {lastPossibleSortKey} from 'warp-contracts';
import type {JWKInterface, Warp} from 'warp-contracts';
import {SDK} from '../hollowdb';

// load state with feedback to console
async function loadState(sdk: SDK) {
  const start = Date.now();
  const interval = setInterval(() => {
    process.stdout.write('Time: ' + (Date.now() - start) / 1000 + ' (s)             \r');
  }, 2000);

  await sdk.getState();

  clearInterval(interval);
  console.log('Done!\n');
}

// gets keys directly from the storage layer (no interactions)
async function getKeysFromStorage(sdk: SDK, contractTxId: string): Promise<string[]> {
  return await sdk.warp.kvStorageFactory(contractTxId).keys(lastPossibleSortKey);
}

// get value from the storage layer (no interactions)
async function getValueFromStorage(sdk: SDK, contractTxId: string, key: string): Promise<unknown | null> {
  return await sdk.warp
    .kvStorageFactory(contractTxId)
    .getLast(key)
    .then(sk => (sk === null ? null : sk.cachedValue));
}

/** Transfer keys & values of a contract to another. */
export async function transfer(
  wallet: JWKInterface,
  warp: Warp,
  srcContractTxId: string,
  destContractTxId: string
): Promise<number> {
  console.log('Creating source SDK...');
  const src = new SDK(wallet, srcContractTxId, warp);
  await loadState(src);

  console.log('Creating destination SDK...');
  const dest = new SDK(wallet, destContractTxId, warp);
  await loadState(dest);

  console.log('Source     : https://sonar.warp.cc/?#/app/contract/' + srcContractTxId);
  console.log('Destination: https://sonar.warp.cc/?#/app/contract/' + destContractTxId);
  console.log('');

  const [srcKeys, destKeys] = await Promise.all([
    getKeysFromStorage(src, srcContractTxId),
    getKeysFromStorage(dest, destContractTxId),
  ]);
  console.log('Number of keys:', '\n\tSRC:', srcKeys.length, '\n\tDEST:', destKeys.length);

  let numKeys = 0;
  async function transferKey(i: number) {
    const srcKey = srcKeys[i];

    // NOTE: you can use a different mapped key!
    const destKey = srcKey;

    if (destKeys.includes(destKey)) {
      console.log(`${i}\t${srcKey} --> ${destKey} skipped (already exists).`);
    } else {
      try {
        const srcVal = await getValueFromStorage(src, srcContractTxId, srcKey);
        await dest.put(destKey, srcVal);
        numKeys++;
        console.log(`${i}\t${srcKey} --> ${destKey}`);
      } catch (err) {
        console.error(`${i}\t${srcKey} could not be transferred.`);
        console.error((err as Error).message);
      }
    }
  }

  console.log('\nStarting...');
  for (let i = 0; i < srcKeys.length; i++) {
    await transferKey(i);
  }
  console.log('\nTransfer complete!');

  return numKeys;
}
