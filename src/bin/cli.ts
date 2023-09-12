#!/usr/bin/env node
import {existsSync, readFileSync} from 'fs';
import {JWKInterface, WarpFactory} from 'warp-contracts';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {deploy, deployFromSrc, evolve, evolveFromSrc} from '../tools';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import {ContractState} from '../contracts/types';
import {prepareState} from '../tools/deploy';

yargs(hideBin(process.argv))
  .scriptName('hollowdb-contracts')
  .option('wallet', {
    alias: 'w',
    describe: 'Path to Arweave wallet',
    string: true,
    demandOption: true,
  })
  .check(yargs => {
    if (!existsSync(yargs.wallet)) {
      throw new Error('A wallet does not exist at the given path.');
    }
    return true;
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
    default: 'mainnet',
    choices: ['mainnet', 'testnet', 'local'],
  })

  .command(
    'evolve',
    'Evolve an existing contract',
    yargs => {
      yargs.option('contractTxId', {
        alias: 'c',
        describe: 'Contract transaction id',
        string: true,
        demandOption: true,
      });
    },
    async args => {
      // prepare warp
      const warp =
        args.target === 'mainnet'
          ? WarpFactory.forMainnet().use(new DeployPlugin())
          : WarpFactory.forTestnet().use(new DeployPlugin());

      // read wallet
      const wallet = JSON.parse(readFileSync(args.wallet, 'utf-8')) as JWKInterface;

      let result;
      if (args.sourceTxId) {
        result = await evolveFromSrc(wallet, warp, args.contractTxId as string, args.sourceTxId);
        console.log(`Contract ${args.contractTxId} evolved from source ${args.sourceTxId}.`);
      } else {
        const code = readFileSync('./src/contracts/build/' + args.name + '.contract.js', 'utf-8');
        result = await evolve(wallet, warp, args.contractTxId as string, code);
        console.log(`Contract ${args.contractTxId} evolved from local ${args.name} code.`);
      }
      console.log(result);
    }
  )

  .command(
    'deploy',
    'Deploy a new contract',
    yargs => {
      yargs.demandOption('name');
      yargs.demandOption('target');
    },
    async args => {
      // prepare warp
      const warp =
        args.target === 'mainnet'
          ? WarpFactory.forMainnet().use(new DeployPlugin())
          : WarpFactory.forTestnet().use(new DeployPlugin());

      // read wallet
      const wallet = JSON.parse(readFileSync(args.wallet, 'utf-8')) as JWKInterface;

      // prepare initial state
      const initialState = JSON.parse(
        readFileSync('./src/contracts/states/' + args.name + '.json', 'utf-8')
      ) as ContractState;
      const preparedState = await prepareState(wallet, initialState, warp);

      // deploy
      let result;
      if (args.sourceTxId) {
        result = await deployFromSrc(wallet, warp, preparedState, args.sourceTxId);
        console.log(`${args.name} contract deployed.`);
      } else {
        const code = readFileSync('./src/contracts/build/' + args.name + '.contract.js', 'utf-8');
        result = await deploy(wallet, warp, preparedState, code);
        console.log(`${args.name} contract deployed from source ${args.sourceTxId}.`);
      }
      console.log(result);
    }
  )

  // only allow one command to be called
  .demandCommand(1, 1)
  .parse();
