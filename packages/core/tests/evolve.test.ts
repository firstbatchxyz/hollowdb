import {JWKInterface, Warp} from 'warp-contracts';
import {SDK} from '../src/hollowdb';
import {setupWarp} from './hooks';
import {deployContract} from './utils';
import {hollowdb as initialState} from '../src/contracts/states/';
import {evolve} from '../src/bin/evolve';

describe('evolve contract', () => {
  const warpHook = setupWarp();

  let warp: Warp;
  let contractTxId: string;
  let owner: JWKInterface;

  beforeAll(async () => {
    const hook = warpHook();
    owner = hook.wallets[0].jwk;
    warp = hook.warp;
    contractTxId = await deployContract(hook.warp, owner, initialState);
  });

  it('should evolve contract', async () => {
    const {contractTxId: newContractTxId, srcTxId: newSrcTxId} = await evolve(
      owner,
      warp,
      contractTxId,
      dummyContractSource
    );

    const sdk = new SDK(owner, newContractTxId, warp);

    // state should have the new source id within its "evolve" field
    const state = await sdk.getState();
    expect(state.evolve).toEqual(newSrcTxId);

    // calling a non-existent function in the new contract should give error
    await expect(sdk.put('1234', '1234')).rejects.toThrow('Contract Error [put]: Unknown function: put');
  });
});

// a dummy contract with just a get function
const dummyContractSource = `
// contracts/hollowDB/actions/read/get.ts
var get = async (state, action) => {
  const {key} = action.input.data;
  return {
    result: await SmartWeave.kv.get(key),
  };
};

// contracts/hollowDB/contract.ts
var handle = (state, action) => {
  switch (action.input.function) {
    case 'get':
      return get(state, action);
    default:
      throw new ContractError('Unknown function: ' + action.input.function);
  }
};
` as string;
