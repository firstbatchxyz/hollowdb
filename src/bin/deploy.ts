import {JWKInterface, Warp} from 'warp-contracts';
import {ContractState} from '../contracts/types';
import {ArweaveSigner} from 'warp-contracts-plugin-deploy';

/** Sets the contract owner as the deployer wallet's address, adds the owner to whitelists and sets contract version. */
export async function prepareState(
  owner: JWKInterface,
  initialState: ContractState,
  warp: Warp
): Promise<ContractState> {
  const ownerAddress = await warp.arweave.wallets.jwkToAddress(owner);

  // owner is the deploying wallet
  initialState.owner = ownerAddress;

  // owner is whitelisted on all lists
  for (const list in initialState.whitelists) {
    initialState.whitelists[list as keyof typeof initialState.whitelists][ownerAddress] = true;
  }

  // if available, hollowdb version is written
  const version = process.env.npm_package_version;
  initialState.version = version || '1.2.x';

  return initialState;
}

/** Deploy a new contract. */
export async function deploy(
  owner: JWKInterface,
  warp: Warp,
  initialState: ContractState,
  contractSourceCode: string
): Promise<{contractTxId: string; srcTxId: string | undefined}> {
  const preparedState = await prepareState(owner, initialState, warp);
  // throw new Error('nope');
  const {contractTxId, srcTxId} = await warp.deploy(
    {
      wallet: warp.environment === 'local' ? owner : new ArweaveSigner(owner),
      initState: JSON.stringify(preparedState),
      src: contractSourceCode,
      evaluationManifest: {
        evaluationOptions: {
          allowBigInt: true,
          useKVStorage: true,
        },
      },
    },
    warp.environment === 'local' // if local, bundling should be disabled
  );

  return {contractTxId, srcTxId};
}

/** Deploy a new contract from an existing contract's source code. */
export async function deployFromSrc(
  owner: JWKInterface,
  warp: Warp,
  initialState: ContractState,
  srcTxId: string
): Promise<{contractTxId: string; srcTxId: string | undefined}> {
  const preparedState = await prepareState(owner, initialState, warp);

  const {contractTxId} = await warp.deployFromSourceTx(
    {
      wallet: warp.environment === 'local' ? owner : new ArweaveSigner(owner),
      initState: JSON.stringify(preparedState),
      srcTxId: srcTxId,
      evaluationManifest: {
        evaluationOptions: {
          allowBigInt: true,
          useKVStorage: true,
        },
      },
    },
    warp.environment === 'local'
  );

  return {contractTxId, srcTxId};
}
