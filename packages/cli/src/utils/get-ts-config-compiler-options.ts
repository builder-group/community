import chalk from 'chalk';
import * as ts from 'typescript';

import type { DynCommand } from '../DynCommand';
import { findNearestTsConfigPath } from './find-nearest-ts-config-path';

export function getTsConfigCompilerOptions(
	command: DynCommand,
	tsConfigPath = findNearestTsConfigPath()
): TTsConfigCompilerOptions {
	const defaultTsConfig: TTsConfigCompilerOptions = { outDir: '.' };
	if (typeof tsConfigPath !== 'string') {
		return defaultTsConfig;
	}

	// Define a host object that implements ParseConfigFileHost.
	// The host provides file system operations and error handling for parsing the configuration file.
	const host: ts.ParseConfigFileHost = {
		fileExists: ts.sys.fileExists,
		readFile: ts.sys.readFile,
		readDirectory: ts.sys.readDirectory,
		useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
			command.error(
				`Unrecoverable error in config file: ${chalk.red(chalk.underline(diagnostic.messageText))}`,
				{ exit: 1 }
			);
		}
	};

	// Read in tsconfig.json
	const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(tsConfigPath, {}, host);

	// Access the parsed tsconfig.json file options
	let resolvedTsConfig = {};
	if (parsedCommandLine != null) {
		resolvedTsConfig = parsedCommandLine.options;
	} else {
		command.error(
			`Failed to parse TypeScript configuration file: ${chalk.underline(tsConfigPath)}`,
			{
				exit: 1
			}
		);
	}

	return { ...defaultTsConfig, ...resolvedTsConfig };
}

export type TTsConfigCompilerOptions = ts.CompilerOptions;
