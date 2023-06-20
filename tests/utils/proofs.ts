import {Admin} from '../../src/hollowdb';

export async function enableProofs(admin: Admin) {
  const {cachedValue: oldCachedValue} = await admin.readState();
  expect(oldCachedValue.state.isProofRequired.auth).toEqual(false);

  await admin.updateProofRequirement('auth', true);

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.isProofRequired.auth).toEqual(true);
}

export async function disableProofs(admin: Admin) {
  const {cachedValue} = await admin.readState();
  expect(cachedValue.state.isProofRequired.auth).toEqual(true);

  await admin.updateProofRequirement('auth', false);

  const {cachedValue: newCachedValue} = await admin.readState();
  expect(newCachedValue.state.isProofRequired.auth).toEqual(false);
}
