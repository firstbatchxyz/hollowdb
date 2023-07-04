import {JWKInterface, Warp} from 'warp-contracts';
import dummyContractSource from './res/dummyContract';
import {Admin, SDK} from '../src/hollowdb';
import {setupArlocal, setupHollowTestState} from './common';

describe('evolve', () => {
  const PORT = setupArlocal(1);
  const getHollowTestState = setupHollowTestState(PORT, 'default');

  let warp: Warp;
  let contractTxId: string;
  let ownerJWK: JWKInterface;

  beforeAll(async () => {
    const testState = getHollowTestState();
    warp = testState.warp;
    contractTxId = testState.contractTxId;
    ownerJWK = testState.ownerAdmin.signer as JWKInterface;
  });

  it('should evolve contract', async () => {
    const newContractSource = dummyContractSource;
    const {contractTxId: newContractTxId, srcTxId: newSrcTxId} = await Admin.evolve(
      ownerJWK,
      newContractSource,
      contractTxId,
      warp,
      true
    );

    // create new SDK
    const ownerSDK = new SDK(ownerJWK, newContractTxId, warp);

    // state should have the new source id within its "evolve" field
    const {cachedValue} = await ownerSDK.readState();
    expect(cachedValue.state.evolve).toEqual(newSrcTxId);

    // calling a non-existent function in the new contract should give error
    await expect(ownerSDK.put('1234', '1234')).rejects.toThrow('Contract Error [put]: Unknown function: put');
  });
});
