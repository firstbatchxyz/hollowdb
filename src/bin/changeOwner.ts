import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../hollowdb';
import fs from 'fs';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

async function main() {
  let walletName = '';
  let contractTxId = '';
  let newOwner = '';

  if (process.argv.length <= 4) {
    throw new Error('Usage: yarn contract:changeOwner <wallet-name> <contract-tx-id> <new-owner>');
  }

  walletName = process.argv[2];
  contractTxId = process.argv[3];
  newOwner = process.argv[4];

  const wallet = JSON.parse(fs.readFileSync(`./config/wallets/${walletName}.json`, 'utf-8')) as JWKInterface;
  const warp = WarpFactory.forMainnet();

  console.log('Changing owner...');
  const admin = new Admin(wallet, contractTxId, warp);
  console.log('Old: ');
  console.log('New: ');
  // TODO: ask for confirmation

  await admin.updateOwner(newOwner);
  console.log('Done.');
}

main();
