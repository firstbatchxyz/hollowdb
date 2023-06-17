import ArLocal from 'arlocal';
import {JWKInterface, LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import dummyContractSource from './res/dummyContract';
import initialState from '../src/contracts/states/hollowdb';
import fs from 'fs';
import {Admin, SDK} from '../src/hollowdb';
import constants from './constants';

describe('evolve', () => {
  let arlocal: ArLocal;
  let warp: Warp;
  let contractTxId: string;
  let ownerJWK: JWKInterface;

  beforeAll(async () => {
    arlocal = new ArLocal(constants.ARWEAVE_PORT + 1, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('none');

    const contractSource = fs.readFileSync('./build/hollowdb.js', 'utf8');

    // setup warp factory for local arweave
    warp = WarpFactory.forLocal(constants.ARWEAVE_PORT + 1).use(new DeployPlugin());

    // get accounts
    const ownerWallet = await warp.generateWallet();
    ownerJWK = ownerWallet.jwk;

    // deploy contract
    contractTxId = (
      await Admin.deploy(
        ownerJWK,
        initialState,
        contractSource,
        warp,
        true // bundling is disabled during testing
      )
    ).contractTxId;

    const contractTx = await warp.arweave.transactions.get(contractTxId);
    expect(contractTx).not.toBeNull();
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

  afterAll(async () => {
    await arlocal.stop();
  });
});
