#!/usr/bin/env node
import {copyFileSync, readFileSync, writeFileSync} from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import {deploy, deployFromSrc} from './deploy';
import {evolve, evolveFromSrc} from './evolve';
import {getPath, prepareCode, prepareState, prepareStateAtPath, prepareWallet, prepareWarp} from './utils';
import {build} from './build';

// Contract creation script will use existing hollowdb contract & state
const BASE_CONTRACT_NAME = 'hollowdb';

yargs(hideBin(process.argv))
  .scriptName('yarn contract')
  // .example('$0 build -n my-contract', 'Build your contract')
  // .example('$0 deploy -n my-contract -w ./my/wallet.json', 'Deploy to mainnet')
  // .example('$0 evolve -n new-contract -c txId -w ./my/wallet.json', 'Evolve an existing contract with new source')

  .option('wallet', {
    alias: 'w',
    describe: 'Path to Arweave wallet',
  })
  .option('name', {
    alias: 'n',
    describe: 'Name of the contract',
  })
  .option('init', {
    alias: 'i',
    describe: 'A specific initial state',
  })
  .option('target', {
    alias: 't',
    describe: 'Target network',
    default: 'main',
    choices: ['main', 'test'],
  })
  .option('sourceTxId', {
    alias: 's',
    describe: 'Source transaction id',
  })
  .option('contractTxId', {
    alias: 'c',
    describe: 'Contract transaction id',
  })
  .string(['wallet', 'name', 'init', 'target', 'sourceTxId', 'contractTxId'])

  .command(
    'deploy',
    'Deploy a new contract',
    yargs => yargs.demandOption(['name', 'target', 'wallet']),
    async args => {
      const warp = prepareWarp(args.target);
      const wallet = prepareWallet(args.wallet);
      const state = args.init
        ? await prepareStateAtPath(wallet, args.init, warp)
        : await prepareState(wallet, args.name, warp);

      let result;
      if (args.sourceTxId) {
        result = await deployFromSrc(wallet, warp, state, args.sourceTxId);
        console.log(`${args.name} contract deployed from source ${args.sourceTxId}.`);
      } else {
        const code = prepareCode(args.name);
        result = await deploy(wallet, warp, state, code);
        console.log(`${args.name} contract deployed.`);
      }
      console.log(result);
    }
  )

  .command(
    'evolve',
    'Evolve an existing contract',
    yargs => yargs.demandOption(['wallet', 'contractTxId']),
    async args => {
      const warp = prepareWarp(args.target);
      const wallet = prepareWallet(args.wallet);

      let result;
      if (args.sourceTxId) {
        result = await evolveFromSrc(wallet, warp, args.contractTxId, args.sourceTxId);
        console.log(`Contract ${args.contractTxId} evolved from source ${args.sourceTxId}.`);
      } else if (args.name) {
        const code = prepareCode(args.name);
        result = await evolve(wallet, warp, args.contractTxId, code);
        console.log(`Contract ${args.contractTxId} evolved from local ${args.name} code.`);
      } else {
        throw new Error('You must provide a contract name or source txId.');
      }
      console.log(result);
    }
  )

  .command(
    'create',
    'Create your own custom contract',
    yargs => yargs.demandOption('name').check(args => args.name !== BASE_CONTRACT_NAME),
    async args => {
      // copy contract code
      const baseContractPath = getPath(BASE_CONTRACT_NAME, 'contract');
      const newContractPath = getPath(args.name, 'contract');
      copyFileSync(baseContractPath, newContractPath);

      // copy state with contract name updated
      const baseState = readFileSync(getPath(BASE_CONTRACT_NAME, 'state'), 'utf-8');
      const newState = baseState.replace('hollowdb', args.name);
      writeFileSync(getPath(args.name, 'state'), newState);
    }
  )

  .command(
    'build',
    'Build a contract',
    yargs => yargs,
    async args => {
      build(args.name);
    }
  )

  // only allow one command to be called
  .demandCommand(1, 1)
  .parse();
