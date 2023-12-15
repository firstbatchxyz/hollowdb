import { JWKInterface, Warp } from "warp-contracts";
import initialState from "../res/initialState";
import { ArweaveSigner } from "warp-contracts-plugin-deploy";
import contractSource from "../res/contractSource";

/**
 * Deploy a new contract via the provided Warp instance.
 * @param owner owner wallet
 * @param warp a `Warp` instance
 *  */
export async function deploy(
  owner: JWKInterface,
  warp: Warp
): Promise<{ contractTxId: string; srcTxId: string | undefined }> {
  // if local, bundling should be disabled
  const disableBundling = warp.environment === "local";

  const { contractTxId, srcTxId } = await warp.deploy(
    {
      wallet: warp.environment === "local" ? owner : new ArweaveSigner(owner),
      initState: JSON.stringify(initialState),
      src: contractSource,
      evaluationManifest: {
        evaluationOptions: {
          allowBigInt: true,
          useKVStorage: true,
        },
      },
    },
    disableBundling
  );

  return { contractTxId, srcTxId };
}
