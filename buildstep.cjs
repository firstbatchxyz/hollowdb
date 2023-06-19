const replace = require('replace-in-file');
const srcDir = 'src';
const outDir = 'lib';
async function main(from, to) {
  const entriesFrom = [
    `"source": "${srcDir}/${from}index.ts",`,
    `"types": "${outDir}/${from}index.d.ts",`,
    `"cjs": "${outDir}/${from}index.cjs",`,
    `"mjs": "${outDir}/${from}index.mjs",`,
  ];
  const entriesTo = [
    `"source": "${srcDir}/${to}index.ts",`,
    `"types": "${outDir}/${to}index.d.ts",`,
    `"cjs": "${outDir}/${to}index.cjs",`,
    `"mjs": "${outDir}/${to}index.mjs",`,
  ];

  const mappings = entriesFrom.map((v, i) => ({
    from: v,
    to: entriesTo[i],
  }));

  mappings.map(({from, to}) =>
    replace.sync({
      files: './package.json',
      from,
      to,
    })
  );
}

if (require.main === module) {
  if (process.argv.length !== 3) {
    throw new Error('Usage: node replace.cjs stepNo');
  }
  const steps = ['', 'common/', 'contracts/', ''];
  const stepNo = parseInt(process.argv[2]);
  if (stepNo === 0 || stepNo >= steps.length) {
    throw new Error('Make sure: 0 < step no < step count');
  }
  main(steps[stepNo - 1], steps[stepNo]);
}
