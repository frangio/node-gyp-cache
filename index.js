#!/usr/bin/env node

const proc = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const envPaths = require('env-paths');
const ora = require('ora');

const pkg = require(path.join(process.cwd(), 'package.json'));
const pkgId = `${pkg.name}@${pkg.version}`;

const cache = path.join(
  envPaths('nicer-node-gyp', { suffix: '' }).cache,
  pkg.name,
  pkg.version,
);

(async function main() {
  const spinner = ora(pkgId).start();

  try {
    const found = await fs.pathExists(cache);

    if (found) {
      spinner.text = `nicer-node-gyp: ${pkgId} restoring build from cache`;
      await fs.copy(cache, 'build');
      spinner.text = `nicer-node-gyp: ${pkgId} restored build from cache`;
    }

    else {
      spinner.text = `nicer-node-gyp: ${pkgId} rebuilding`;
      await node_gyp(process.argv.slice(2));
      spinner.text = `nicer-node-gyp: ${pkgId} storing build in cache`;
      await fs.copy('build', cache);
      spinner.text = `nicer-node-gyp: ${pkgId} rebuilt and cached`;
    }

    spinner.succeed();
  } catch (error) {
    spinner.fail();
    console.error(error);
    process.exitCode = 1;
  }
})();

async function node_gyp(args) {
  const paths = [
    'lib/node_modules/npm/node_modules',
    'share',
  ];

  const bin = await find(
    paths.map(p =>
      path.join(process.argv[0], '../..', p, 'node-gyp/bin/node-gyp.js')
    ),
    fs.pathExists,
  );

  return new Promise((resolve, reject) => {
    let stderr = '';

    const child = proc.execFile(
      bin,
      args,
      { stdio: ['ignore', 'ignore', 'pipe'] },
      (error) => {
        if (error) {
          reject(stderr);
        } else {
          resolve(stderr);
        }
      }
    );

    child.stderr.on('data', data => stderr += data);
  });
}

async function find(array, pred) {
  for (const elem of array) {
    if (await pred(elem)) {
      return elem;
    }
  }
}
