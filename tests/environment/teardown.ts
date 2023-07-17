import ArLocal from 'arlocal';

// This is a Jest environment teardown script, runs only once after all tests.
module.exports = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const arlocal = globalThis._arlocal as ArLocal;
  await arlocal.stop();

  // need to terminate curve_bn128 so that tests do not hang
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const curve_bn128 = globalThis.curve_bn128;
  if (curve_bn128) {
    await curve_bn128.terminate();
  }
};
