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
  let proofSystem = '';
  let walletName = '';
  if (process.argv.length === 4) {
    proofSystem = process.argv[3];
    walletName = process.argv[2];
  } else if (process.argv.length === 3) {
    walletName = process.argv[2];
  } else {
    throw new Error('Usage: yarn contract:deploy <wallet-name> [<groth16 | plonk>]');
  }

  // read wallet
  const walletPath = __dirname + '/../config/wallet/' + walletName + '.json';
  const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8')) as JWKInterface;

  // read source code
  const contractSourcePath = __dirname + '/../build/hollowDB/contract.js';
  const contractSource = fs.readFileSync(contractSourcePath, 'utf-8');

  // update verification key if needed
  if (proofSystem === 'groth16' || proofSystem === 'plonk') {
    const verKeyPath = __dirname + `/../circuits/hollow-authz-${proofSystem}/verification_key.json`;
    const verKey = JSON.parse(fs.readFileSync(verKeyPath, 'utf-8'));
    initialState.verificationKey = verKey;
  }

  // deploying to mainnet
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  // deploy
  console.log('Deploying contract...');
  const result = await Admin.deploy(wallet, initialState, contractSource, warp);
  console.log('Deployed.', result);
}

main();
