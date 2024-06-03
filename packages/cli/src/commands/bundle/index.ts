import path from 'node:path';
import { Flags } from '@oclif/core';
import chalk from 'chalk';
import type { PackageJson } from 'type-fest';

import { DynCommand } from '../../DynCommand';
import {
	bundleAllWithRollup,
	bundleWithTsc,
	createLibraryRollupConfig,
	generateDts,
	getDynConfig
} from '../../services';
import { doesFileExist, promisifyFiglet, readJsonFile } from '../../utils';

export default class Bundle extends DynCommand {
	static description = 'Bundle dyn.art packages';

	static examples = [];

	static flags = {
		target: Flags.string({
			char: 't',
			description: 'Bundle target',
			required: false,
			default: 'prod',
			options: ['prod', 'dev']
		}),
		bundleStrategy: Flags.string({
			char: 'b',
			description: `Bundle strategy like 'rollup', 'tsc' or 'typesonly'`,
			required: false,
			default: 'rollup',
			options: ['rollup', 'tsc', 'typesonly']
		}),
		analyze: Flags.boolean({
			char: 'a',
			description: 'Analyze bundle',
			required: false,
			default: false
		}),
		sourcemap: Flags.boolean({
			char: 's',
			description: 'Generate sourcemaps',
			required: false,
			default: false
		}),
		format: Flags.string({
			char: 'f',
			description: `Bundle format like 'esm', 'cjs' or 'all' when using the bundle strategy 'rollup'`,
			required: false,
			default: 'all',
			options: ['all', 'esm', 'cjs']
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
		const { flags } = await this.parse(Bundle);
		this.isVerbose = flags.verbose;
		this.isProduction = flags.target === 'prod';
		const startTime = Date.now();

		// Read in package.json
		const packageJson = await this.getPackageJson();
		if (packageJson == null) {
			this.error(`No package.json file found at '${chalk.underline(process.cwd())}'!`, { exit: 1 });
		}

		this.log(chalk.yellowBright(await promisifyFiglet('dyn bundler')));
		this.log(`\n`);
		this.log(
			`Started bundling package ${chalk.magenta(
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
		const libraryConfig = dynConfig?.library;

		// Bundle package based on bundle strategy
		switch (flags.bundleStrategy) {
			case 'rollup':
				if (flags.format === 'all' || flags.format === 'esm') {
					await bundleAllWithRollup(
						this,
						await createLibraryRollupConfig(this, {
							format: 'esm',
							isProduction: this.isProduction,
							preserveModules: true,
							sourcemap: flags.sourcemap,
							libraryConfig,
							tsConfigPath,
							packageJson
						})
					);
				}
				if (flags.format === 'all' || flags.format === 'cjs') {
					await bundleAllWithRollup(
						this,
						await createLibraryRollupConfig(this, {
							format: 'cjs',
							isProduction: this.isProduction,
							preserveModules: true,
							sourcemap: flags.sourcemap,
							libraryConfig,
							tsConfigPath,
							packageJson
						})
					);
				}
				await generateDts(this, { tsConfigPath });
				break;
			case 'tsc':
				await bundleWithTsc(this);
				break;
			case 'typesonly':
				await generateDts(this, { tsConfigPath });
				break;
			default:
				this.error(`Unknown build strategy '${flags.buildStrategy}'!`, { exit: 1 });
		}

		this.log(`\n`);
		this.log(
			`${chalk.green('→')} Package was bundled in ${chalk.green(
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
