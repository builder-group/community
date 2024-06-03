import path from 'node:path';
import chalk from 'chalk';

import type { DynCommand } from '../../DynCommand';
import { readJsFile } from '../../utils';
import type { TDynConfig } from './types';

export async function getDynConfig(command: DynCommand): Promise<TDynConfig | null> {
	const dynConfigPath = path.resolve(process.cwd(), 'dyn.config.js');
	const dynConfig = await readJsFile<TDynConfig>(dynConfigPath);

	if (dynConfig != null) {
		command.log(
			`🗞️  Detected ${chalk.underline('dyn.config.js')} at ${chalk.gray(
				chalk.underline(dynConfigPath)
			)}`
		);
	}

	return dynConfig;
}
