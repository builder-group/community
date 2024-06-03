import chalk from 'chalk';

import type { DynCommand } from '../DynCommand';

export async function execaVerbose(
	toExecuteCommand: string,
	args: string[],
	config: TExecaVerboseConfig
): Promise<void> {
	const { command, verbose = false, ...execaConfig } = config;
	const { execa } = await import('execa');
	const subprocess = execa(toExecuteCommand, args, { verbose, ...execaConfig });

	if (verbose) {
		subprocess.stdout?.on('data', (data) => {
			command.log(chalk.gray(`\t${data}`));
		});

		subprocess.stderr?.on('data', (data) => {
			command.log(chalk.gray(`\t${data}`));
		});
	}

	try {
		await subprocess;
	} catch (error) {
		command.error(
			`An error occured while executing command: ${chalk.yellow(
				`${toExecuteCommand} ${args.join(' ')}`
			)} \n\n ${chalk.gray(`\t${error as any}`)}`
		);
		process.exit(1);
	}
}

interface TExecaVerboseConfig {
	cwd?: string;
	verbose?: boolean;
	command: DynCommand;
}
