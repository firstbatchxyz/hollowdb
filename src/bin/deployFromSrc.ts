import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../hollowdb';
import fs from 'fs';
import {initialState} from '../contracts/hollowdb';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

async function main() {
  let protocol = '';
  let sourceTxId = '';
  let walletName = '';
  if (process.argv.length <= 3) {
    throw new Error('Usage: yarn contract:deployFromSrc <wallet-name> <source-txid> [<groth16 | plonk>]');
  }
  if (process.argv.length > 4) {
    protocol = process.argv[4];
  }
  walletName = process.argv[2];
  sourceTxId = process.argv[3];

  const wallet = JSON.parse(fs.readFileSync(`./config/wallets/${walletName}.json`, 'utf-8')) as JWKInterface;
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  if (protocol === 'groth16' || protocol === 'plonk') {
    initialState.verificationKeys.auth = JSON.parse(
      fs.readFileSync(`./config/circuits/hollow-authz-${protocol}/verification_key.json`, 'utf-8')
    );
  }

  console.log('Deploying contract...');
  const result = await Admin.deployFromSrc(wallet, initialState, sourceTxId, warp);
  console.log('Deployed.', result);
  console.log(`https://sonar.warp.cc/#/app/contract/${result.contractTxId}`);
}

main();
