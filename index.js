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
      spinner.text = `${pkgId} restoring build from cache`;
      await fs.copy(cache, 'build');
      spinner.text = `${pkgId} restored build from cache`;
    }

    else {
      spinner.text = `${pkgId} rebuilding`;
      await node_gyp(process.argv.slice(2));
      spinner.text = `${pkgId} storing build in cache`;
      await fs.copy('build', cache);
      spinner.text = `${pkgId} rebuilt and cached`;
    }

    spinner.succeed();
  } catch (error) {
    spinner.fail();
    console.error(error);
    process.exitCode = 1;
  }
})();

function node_gyp(args) {
  return new Promise((resolve, reject) => {
    let stderr = '';

    const child = proc.execFile(
      path.join(
        process.argv[0],
        '../../lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js',
      ),
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
