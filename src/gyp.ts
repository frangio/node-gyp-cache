import proc from 'child_process';
import path from 'path';
import stream from 'stream';
import { constants as fsConstants } from 'fs';
import fs from 'fs-extra';
import envPaths from 'env-paths';
import ora from 'ora';

const paths = envPaths('node-gyp-cache', { suffix: '' });

export default async function gyp(command: string, options: string[]) {
  const name = process.env.npm_package_name;
  const version = process.env.npm_package_version;

  if (name === undefined || version === undefined) {
    throw new Error('Must be invoked through npm');
  }

  const logDir = path.join(paths.temp, name, version);
  await fs.ensureDir(logDir);
  const logPath = path.join(logDir, `${Date.now()}.log`);
  const logFile = fs.createWriteStream(logPath);
  try {
    await new Gyp(name, version, command, options, logFile).run();
  } catch (e) {
    logFile.end();
    throw new Error(`logs saved at ${logPath}`);
    console.error();
  }
}

class Gyp {
  private readonly useCache: boolean;
  private spinner?: ora.Ora;

  constructor(
    readonly name: string,
    readonly version: string,
    readonly command: string,
    readonly options: string[],
    readonly logFile: fs.WriteStream,
  ) {
    this.useCache = process.cwd().split(path.sep).includes('node_modules');
  }

  async run(): Promise<void> {
    try {
      await this._run();
    } catch (e) {
      await this.log(e.message);
      this.spinner?.fail();
      throw e;
    }
  }

  async _run(): Promise<void> {
    if (this.isBuild) {
      this.spinner = ora('node-gyp-cache').start();

      const restoredFromCache = this.useCache && await this.cacheGet();

      if (!restoredFromCache) {
        await this.cmd();
      }

      if (this.useCache && !restoredFromCache) {
        await this.cachePut();
      }

      this.spinner.succeed();
    } else {
      if (this.command === 'clean') {
        await this.cachePurge();
      }

      await this.cmd();
    }
  }

  async cmd() {
    await this.log('running node-gyp');

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

    if (bin === undefined) {
      throw new Error('node-gyp executable not found');
    }

    const child = proc.spawn(
      bin,
      [this.command, ...this.options],
      { stdio: ['inherit', this.stdout, this.stderr] },
    );

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          this.log('finished running node-gyp').then(resolve);
        } else {
          reject(new Error('error running node-gyp'));
        }
      });
    });
  }

  async cacheGet(): Promise<boolean> {
    try {
      await fs.access(this.cachePath, fsConstants.R_OK | fsConstants.W_OK);
      await this.log('restoring build from cache');
      await fs.copy(this.cachePath, 'build');
      await this.log('restored build from cache');
      return true;
    } catch (e) {
      await this.log('failed to restore build from cache');
      return false;
    }
  }

  async cachePut(): Promise<void> {
    await this.log('storing build in cache');
    await fs.copy('build', this.cachePath);
    await this.log('rebuilt and cached');
  }

  async cachePurge(): Promise<void> {
    await this.log('purging cache');
    await fs.remove(this.cachePath);
    await this.log('rebuilt and cached');
  }

  async log(msg: string): Promise<void> {
    if (this.spinner !== undefined) {
      this.spinner.text = `node-gyp-cache: ${msg}`;
    }

    return new Promise((resolve, reject) => {
      this.logFile.write(msg + '\n', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  get stderr(): fs.WriteStream | 'inherit' {
    return this.isBuild ? this.logFile : 'inherit';
  }

  get stdout(): fs.WriteStream | 'inherit' {
    return this.isBuild ? this.logFile : 'inherit';
  }

  get isBuild(): boolean {
    return this.command === 'build' || this.command === 'rebuild';
  }

  get cachePath(): string {
    return path.join(paths.cache, this.name, this.version);
  }
}

async function find<T>(array: T[], pred: (t: T) => Promise<boolean>): Promise<T | undefined> {
  for (const elem of array) {
    if (await pred(elem)) {
      return elem;
    }
  }
}
