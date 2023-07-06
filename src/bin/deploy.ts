import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../hollowdb';
import fs from 'fs';
import initialHollowState from '../contracts/states/hollowdb';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

async function main() {
  let protocol = '';
  let walletName = '';
  if (process.argv.length <= 2) {
    throw new Error('Usage: yarn contract:deploy <wallet-name> [<groth16 | plonk>]');
  }
  if (process.argv.length > 3) {
    protocol = process.argv[3];
  }
  walletName = process.argv[2];

  const wallet = JSON.parse(fs.readFileSync(`./config/wallets/${walletName}.json`, 'utf-8')) as JWKInterface;
  const contractSource = fs.readFileSync('./build/hollowdb.js', 'utf-8');
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  if (protocol === 'groth16' || protocol === 'plonk') {
    initialHollowState.verificationKeys.auth = JSON.parse(
      fs.readFileSync(`./config/circuits/hollow-authz-${protocol}/verification_key.json`, 'utf-8')
    );
  }

  console.log('Deploying contract...');
  const result = await Admin.deploy(wallet, initialHollowState, contractSource, warp);
  console.log('Deployed.', result);
  console.log(`https://sonar.warp.cc/#/app/contract/${result.contractTxId}`);
}

main();
