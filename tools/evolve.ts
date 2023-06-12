import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../src/';
import {fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function evolve() {
  if (process.argv.length !== 4) {
    throw new Error('Usage: yarn contract:evolve <wallet-name> <contract-tx-id>');
  }
  const walletName = process.argv[2];
  const contractTxId = process.argv[3];

  // read wallet
  const walletPath = __dirname + '/../config/wallet/' + walletName + '.json';
  const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8')) as JWKInterface;

  // read the new source code
  const contractSourcePath = __dirname + '/../build/hollowDB/contract.js';
  const contractSource = fs.readFileSync(contractSourcePath, 'utf-8');

  // create a warp instance
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  // evolve
  console.log('Evolving contract...');
  const result = await Admin.evolve(wallet, contractSource, contractTxId, warp);
  console.log('Evolved.', result);
}

evolve();
