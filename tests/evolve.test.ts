import ArLocal from 'arlocal';
import {JWKInterface, LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import dummyContractSource from './res/dummyContract';
import initialState from '../common/initialState';
import fs from 'fs';
import path from 'path';
import {Admin, SDK} from '../src';
import constants from './constants';

// arbitrarily long timeout
jest.setTimeout(constants.JEST_TIMEOUT_MS);

describe('hollowdb evolve', () => {
  let arlocal: ArLocal;
  let contractSource: string;
  let contractTxId: string;
  let newContractSource: string;
  let warp: Warp;

  let ownerJWK: JWKInterface;

  beforeAll(async () => {
    /**
     * TODO: we are creating a new arlocal instance here, otherwise it clashes with the other one
     * we may use fixtures as a fix here
     */
    arlocal = new ArLocal(constants.ARWEAVE_PORT + 1, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('error');

    contractSource = fs.readFileSync(path.join(__dirname, '../build/hollowDB/contract.js'), 'utf8');
    newContractSource = dummyContractSource;

    // setup warp factory for local arweave
    warp = WarpFactory.forLocal(constants.ARWEAVE_PORT + 1).use(new DeployPlugin());

    // get accounts
    const ownerWallet = await warp.generateWallet();
    ownerJWK = ownerWallet.jwk;

    // deploy contract
    const {contractTxId: hollowDBTxId} = await Admin.deploy(
      ownerJWK,
      initialState,
      contractSource,
      warp,
      true // bundling is disabled during testing
    );

    const contractTx = await warp.arweave.transactions.get(hollowDBTxId);
    expect(contractTx).not.toBeNull();

    contractTxId = hollowDBTxId;
  });

  it('should evolve contract', async () => {
    // evolve
    const {contractTxId: newContractTxId, srcTxId: newSrcTxId} = await Admin.evolve(
      ownerJWK,
      newContractSource,
      contractTxId,
      warp,
      true
    );

    // create new SDK
    const ownerSDK = new SDK({
      signer: ownerJWK,
      contractTxId: newContractTxId,
      cacheType: 'lmdb',
      warp,
    });

    // state should have the new source id within its "evolve" field
    const {cachedValue} = await ownerSDK.readState();
    expect(cachedValue.state.evolve).toEqual(newSrcTxId);

    // calling a non-existent function in the new contract should give error
    await expect(ownerSDK.put('1234', '1234')).rejects.toThrow('Contract Error [put]: Unknown function: put');
  });
});
