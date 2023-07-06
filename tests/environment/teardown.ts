import ArLocal from 'arlocal';

// This is a Jest environment teardown script, runs only once after all tests.
module.exports = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const arlocal = globalThis._arlocal as ArLocal;
  await arlocal.stop();
};
