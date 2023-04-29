import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../src';
import {fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs';
import initialState from '../common/initialState';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  let walletName = 'wallet-main';
  if (process.argv.length === 3) {
    walletName = process.argv[2];
  }

  // read wallet
  const walletPath = __dirname + '/../config/wallet/' + walletName + '.json';
  const wallet = JSON.parse(fs.readFileSync(walletPath).toString()) as JWKInterface;

  // read source code
  const contractSourcePath = __dirname + '/../build/hollowDB/contract.js';
  const contractSource = fs.readFileSync(contractSourcePath).toString();

  // deploying to mainnet
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  // deploy
  console.log('Deploying contract...');
  const result = await Admin.deploy(wallet, initialState, contractSource, warp);
  console.log('Deployed.', result);
}

main();
