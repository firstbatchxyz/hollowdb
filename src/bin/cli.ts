#!/usr/bin/env node
import {copyFileSync, existsSync, readFileSync} from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {deploy, deployFromSrc, evolve, evolveFromSrc} from '../tools';
import {getPath, prepareCode, prepareState, prepareWallet, prepareWrap} from './utils';

const BASE_CONTRACT_NAME = 'hollowdb';

yargs(hideBin(process.argv))
  .scriptName('hollowdb-contracts')
  .option('wallet', {
    alias: 'w',
    describe: 'Path to Arweave wallet',
    string: true,
  })

  .option('name', {
    alias: 'n',
    describe: 'Name of the contract.',
    string: true,
  })
  .option('sourceTxId', {
    alias: 's',
    describe: 'Source transaction id',
    string: true,
  })
  .option('target', {
    alias: 't',
    describe: 'Target network',
    default: 'main',
    choices: ['main', 'test'],
  })

  .command(
    'evolve',
    'Evolve an existing contract',
    yargs =>
      yargs.demandOption('wallet').option('contractTxId', {
        alias: 'c',
        describe: 'Contract transaction id',
        string: true,
        demandOption: true,
      }),
    async args => {
      const warp = prepareWrap(args.target);
      const wallet = prepareWallet(args.wallet);

      let result;
      if (args.sourceTxId) {
        result = await evolveFromSrc(wallet, warp, args.contractTxId, args.sourceTxId);
        console.log(`Contract ${args.contractTxId} evolved from source ${args.sourceTxId}.`);
      } else {
        // TODO: check if name is valid
        const code = prepareCode(args.name!);
        result = await evolve(wallet, warp, args.contractTxId, code);
        console.log(`Contract ${args.contractTxId} evolved from local ${args.name} code.`);
      }
      console.log(result);
    }
  )

  .command(
    'deploy',
    'Deploy a new contract',
    yargs => yargs.demandOption('name').demandOption('target').demandOption('wallet'),
    async args => {
      const warp = prepareWrap(args.target);
      const wallet = prepareWallet(args.wallet);
      const state = await prepareState(wallet, args.name, warp);

      let result;
      if (args.sourceTxId) {
        result = await deployFromSrc(wallet, warp, state, args.sourceTxId);
        console.log(`${args.name} contract deployed.`);
      } else {
        const code = prepareCode(args.name);
        result = await deploy(wallet, warp, state, code);
        console.log(`${args.name} contract deployed from source ${args.sourceTxId}.`);
      }
      console.log(result);
    }
  )

  .command(
    'new',
    'Setup a new custom contract.',
    yargs => yargs.demandOption('name').check(args => args.name !== BASE_CONTRACT_NAME),
    async args => {
      const baseContractPath = getPath(BASE_CONTRACT_NAME, 'contract');
      const newContractPath = getPath(args.name, 'contract');
      copyFileSync(baseContractPath, newContractPath);

      const baseStatePath = getPath(BASE_CONTRACT_NAME, 'state');
      const newStatePath = getPath(args.name, 'state');
      copyFileSync(baseStatePath, newStatePath);
    }
  )

  // only allow one command to be called
  .demandCommand(1, 1)
  .parse();
