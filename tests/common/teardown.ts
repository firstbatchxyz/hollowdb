import ArLocal from 'arlocal';

module.exports = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const arlocal = globalThis._arlocal as ArLocal;
  await arlocal.stop();
};
