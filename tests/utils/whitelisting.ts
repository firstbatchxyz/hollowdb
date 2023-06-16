import {Admin} from '../../src';

export async function enableWhitelisting(admin: Admin) {
  const {cachedValue: oldCachedValue} = await admin.readState();
  expect(oldCachedValue.state.isWhitelistRequired.put).toEqual(false);
  expect(oldCachedValue.state.isWhitelistRequired.update).toEqual(false);

  await admin.updateRequirement('whitelist', 'put', true);
  await admin.updateRequirement('whitelist', 'update', true);

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.isWhitelistRequired.put).toEqual(true);
  expect(newCachedValue.state.isWhitelistRequired.update).toEqual(true);
}

export async function disableWhitelisting(admin: Admin) {
  const {cachedValue: oldCachedValue} = await admin.readState();
  expect(oldCachedValue.state.isWhitelistRequired.put).toEqual(true);
  expect(oldCachedValue.state.isWhitelistRequired.update).toEqual(true);

  await admin.updateRequirement('whitelist', 'put', false);
  await admin.updateRequirement('whitelist', 'update', false);

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.isWhitelistRequired.put).toEqual(false);
  expect(newCachedValue.state.isWhitelistRequired.update).toEqual(false);
}

export async function addToWhitelist(admin: Admin, address: string) {
  const {cachedValue: oldCachedValue} = await admin.readState();
  expect(oldCachedValue.state.whitelists.put).not.toHaveProperty(address);
  expect(oldCachedValue.state.whitelists.update).not.toHaveProperty(address);

  await admin.updateWhitelist([address], 'put', 'add');
  await admin.updateWhitelist([address], 'update', 'add');

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.whitelists.put).toHaveProperty(address);
  expect(newCachedValue.state.whitelists.update).toHaveProperty(address);
  expect(newCachedValue.state.whitelists.put[address]).toEqual(true);
  expect(newCachedValue.state.whitelists.update[address]).toEqual(true);
}

export async function removeFromWhitelist(admin: Admin, address: string) {
  const {cachedValue} = await admin.readState();
  expect(cachedValue.state.whitelists.put).toHaveProperty(address);
  expect(cachedValue.state.whitelists.update).toHaveProperty(address);
  expect(cachedValue.state.whitelists.put[address]).toEqual(true);
  expect(cachedValue.state.whitelists.update[address]).toEqual(true);

  await admin.updateWhitelist([address], 'put', 'remove');
  await admin.updateWhitelist([address], 'update', 'remove');

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.whitelists.put).not.toHaveProperty(address);
  expect(newCachedValue.state.whitelists.update).not.toHaveProperty(address);
}
