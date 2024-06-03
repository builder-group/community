import path from 'node:path';
import chalk from 'chalk';

import type { DynCommand } from '../../DynCommand';
import { execaVerbose } from '../../utils';

export async function bundleWithTsc(command: DynCommand): Promise<void> {
	const tsconfig = path.resolve(process.cwd(), './tsconfig.json');

	command.log(
		'🚀 Started bundling Typescript files.',
		command.isVerbose
			? chalk.gray(
					JSON.stringify({
						args: [{ tsconfig }]
					})
				)
			: ''
	);

	await execaVerbose('pnpm', ['tsc', '--project', tsconfig], { command });

	command.log('🏁 Completed bundling Typescript files.');
}
