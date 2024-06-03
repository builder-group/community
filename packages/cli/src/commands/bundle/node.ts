import path from 'node:path';
import { Flags } from '@oclif/core';
import chalk from 'chalk';
import type { PackageJson } from 'type-fest';

import { DynCommand } from '../../DynCommand';
import { bundleAllWithRollup, createNodeRollupConfig, getDynConfig } from '../../services';
import { doesFileExist, promisifyFiglet, readJsonFile } from '../../utils';

export default class Node extends DynCommand {
	static description = 'Bundle Figma Plugin of dyn.art';

	static examples = [];

	static flags = {
		target: Flags.string({
			char: 't',
			description: 'Bundle target',
			required: false,
			default: 'prod',
			options: ['prod', 'dev']
		}),
		analyze: Flags.boolean({
			char: 'a',
			description: 'Analyze bundle',
			required: false,
			default: false
		}),
		bundleDeps: Flags.boolean({
			description: 'Include dependencies in bundle',
			required: false,
			default: false
		}),
		verbose: Flags.boolean({
			char: 'v',
			description: 'More detailed logs',
			required: false,
			default: false
		})
	};

	static args = {};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Node);
		this.isVerbose = flags.verbose;
		this.isProduction = flags.target === 'prod';
		const startTime = Date.now();

		// Read in package.json
		const packageJson = await this.getPackageJson();
		if (packageJson == null) {
			this.error(`No package.json file found at '${chalk.underline(process.cwd())}'!`, { exit: 1 });
		}

		this.log(chalk.yellowBright(await promisifyFiglet('dyn nodler')));
		this.log(`\n`);
		this.log(
			`Started bundling Node App ${chalk.magenta(
				chalk.underline(packageJson.name ?? 'unknown-package')
			)} for ${this.isProduction ? chalk.green('production') : chalk.blue('development')}`
		);
		this.log(`\n`);

		// Read in tsconfig.json
		const tsConfigPath = this.getValidTsConfigJsonPath(this.isProduction);
		if (tsConfigPath == null) {
			this.error(`No tsconfig.json file found at '${chalk.underline(process.cwd())}'!`, {
				exit: 1
			});
		}

		// Read in dyn.config.js
		const dynConfig = await getDynConfig(this);
		const nodeConfig = dynConfig?.node;

		// Bundle
		await bundleAllWithRollup(
			this,
			await createNodeRollupConfig(this, {
				isProduction: this.isProduction,
				bundleDeps: flags.bundleDeps,
				nodeConfig,
				tsConfigPath,
				packageJson
			})
		);

		this.log(`\n`);
		this.log(
			`${chalk.green('→')} Node App was bundled in ${chalk.green(
				chalk.underline(`${((Date.now() - startTime) / 1000).toFixed(2)}s`)
			)}.`
		);
		this.log(`\n`);
		this.exit(0);
	}

	private async getPackageJson(): Promise<PackageJson | null> {
		const packageJsonPath = path.join(process.cwd(), 'package.json');
		return readJsonFile<PackageJson>(packageJsonPath);
	}

	private getValidTsConfigJsonPath(isProduction: boolean): string | null {
		let tsConfigPath: string;
		if (isProduction) {
			tsConfigPath = path.resolve(process.cwd(), 'tsconfig.prod.json');
		} else {
			tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json');
		}
		if (!doesFileExist(tsConfigPath)) {
			return isProduction ? this.getValidTsConfigJsonPath(false) : null;
		}
		return tsConfigPath;
	}
}
