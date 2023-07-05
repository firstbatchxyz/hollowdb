import ArLocal from 'arlocal';
import constants from '../constants';

module.exports = async () => {
  const arlocal = new ArLocal(constants.ARWEAVE_PORT, false);
  await arlocal.start();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  globalThis._arlocal = arlocal;
};
