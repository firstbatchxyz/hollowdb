import type {JWKInterface, Warp} from 'warp-contracts';
import {ArweaveSigner} from 'warp-contracts-plugin-deploy';

/** Evolve an existing contract with a new source code. */
export async function evolve(
  owner: JWKInterface,
  warp: Warp,
  contractTxId: string,
  contractSourceCode: string
): Promise<{contractTxId: string; srcTxId: string}> {
  const newSource = await warp.createSource(
    {src: contractSourceCode},
    warp.environment === 'local' ? owner : new ArweaveSigner(owner)
  );
  const newSrcTxId = await warp.saveSource(newSource);

  return evolveFromSrc(owner, warp, contractTxId, newSrcTxId);
}

/** Evolve an existing contract with a source code of an existing contract. */
export async function evolveFromSrc(
  owner: JWKInterface,
  warp: Warp,
  contractTxId: string,
  srcTxId: string
): Promise<{contractTxId: string; srcTxId: string}> {
  const contract = warp.contract(contractTxId).connect(owner);

  await contract.evolve(srcTxId);

  return {contractTxId, srcTxId};
}
