import {Admin} from '../../src';

export async function enableProofs(admin: Admin) {
  const {cachedValue: oldCachedValue} = await admin.readState();
  expect(oldCachedValue.state.isProofRequired.auth).toEqual(false);

  await admin.updateRequirement('proof', 'auth', true);

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.isProofRequired.auth).toEqual(true);
}

export async function disableProofs(admin: Admin) {
  const {cachedValue} = await admin.readState();
  expect(cachedValue.state.isProofRequired.auth).toEqual(true);

  await admin.updateRequirement('proof', 'auth', false);

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.isProofRequired.auth).toEqual(false);
}
