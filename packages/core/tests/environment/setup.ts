import ArLocal from 'arlocal';
import constants from '../constants';

// This is a Jest environment setup script, runs only once before all tests.
module.exports = async () => {
  const arlocal = new ArLocal(constants.ARWEAVE_PORT, false);
  await arlocal.start();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  globalThis._arlocal = arlocal;
};
