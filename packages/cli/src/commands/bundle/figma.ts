import fs from 'node:fs/promises';
import path from 'node:path';
import { Flags } from '@oclif/core';
import chalk from 'chalk';
import type { PackageJson } from 'type-fest';

import { DynCommand } from '../../DynCommand';
import {
	bundleAllWithRollup,
	createFigmaRollupConfig,
	getDynConfig,
	watchWithRollup
} from '../../services';
import { doesFileExist, promisifyFiglet, readJsonFile } from '../../utils';

export default class Figma extends DynCommand {
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
		sourcemap: Flags.boolean({
			char: 's',
			description: 'Generate sourcemaps',
			required: false,
			default: false
		}),
		verbose: Flags.boolean({
			char: 'v',
			description: 'More detailed logs',
			required: false,
			default: false
		}),
		watch: Flags.boolean({
			char: 'w',
			description: 'Watch mode',
			required: false,
			default: false
		})
	};

	static args = {};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Figma);
		this.isVerbose = flags.verbose;
		this.isProduction = flags.target === 'prod';
		const startTime = Date.now();

		// Read in package.json
		const packageJson = await this.getPackageJson();
		if (packageJson == null) {
			this.error(`No package.json file found at '${chalk.underline(process.cwd())}'!`, { exit: 1 });
		}

		this.log(chalk.yellowBright(await promisifyFiglet('dyn figler')));
		this.log(`\n`);
		this.log(
			`Started bundling Figma Plugin ${chalk.magenta(
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
		const figmaConfig =
			typeof dynConfig?.figma === 'function'
				? await dynConfig.figma({ isProduction: this.isProduction, isWatchMode: flags.watch })
				: dynConfig?.figma;

		// Watch
		if (flags.watch) {
			const rollupOptions = await createFigmaRollupConfig(this, {
				isProduction: this.isProduction,
				isWatchMode: flags.watch,
				sourcemap: flags.sourcemap,
				tsConfigPath,
				packageJson,
				figmaConfig
			});
			let firstBuild = true;

			// Watch on app part changes
			watchWithRollup(this, rollupOptions[0], async ({ event }) => {
				if (event.code === 'END') {
					if (firstBuild) {
						await this.moveManfiestIntoDist();
						firstBuild = false;
					}
					await this.deleteAppJs();
				}
			});

			// Watch on plugin part changes
			watchWithRollup(this, rollupOptions[1]);

			return;
		}

		// Bundle
		await bundleAllWithRollup(
			this,
			await createFigmaRollupConfig(this, {
				isProduction: this.isProduction,
				sourcemap: flags.sourcemap,
				tsConfigPath,
				packageJson,
				figmaConfig
			})
		);

		await this.moveManfiestIntoDist();
		await this.deleteAppJs();

		this.log(`\n`);
		this.log(
			`${chalk.green('→')} Figma Plugin was bundled in ${chalk.green(
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

	// Moves manifest.json (Figma's entry point) into dist folder
	private async moveManfiestIntoDist(): Promise<void> {
		await fs.copyFile(
			path.join(process.cwd(), 'manifest.json'),
			path.join(process.cwd(), 'dist', 'manifest.json')
		);
	}

	// Deletes app.js file as its embedded in app.html
	private async deleteAppJs(): Promise<void> {
		await fs.unlink(path.join(process.cwd(), 'dist', 'app.js'));
	}
}
