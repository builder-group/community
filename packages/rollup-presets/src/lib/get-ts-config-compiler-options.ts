import pc from 'picocolors';
import * as ts from 'typescript';
import { getTsConfigPath } from '.';

/**
 * Parses and returns the compiler options from a TypeScript configuration file.
 * Falls back to default options if the file cannot be parsed.
 */
export function getTsConfigCompilerOptions(
	tsConfigPath = getTsConfigPath(),
	defaultOptions: ts.CompilerOptions = { outDir: '.' }
): ts.CompilerOptions {
	if (typeof tsConfigPath !== 'string') {
		return defaultOptions;
	}

	const host: ts.ParseConfigFileHost = createConfigFileHost();
	const parsedConfig = ts.getParsedCommandLineOfConfigFile(tsConfigPath, {}, host);

	if (parsedConfig == null) {
		console.log(`Failed to parse TypeScript configuration file: ${pc.underline(tsConfigPath)}`);
		process.exit(1);
	}

	return { ...defaultOptions, ...parsedConfig.options };
}

function createConfigFileHost(): ts.ParseConfigFileHost {
	return {
		fileExists: ts.sys.fileExists,
		readFile: ts.sys.readFile,
		readDirectory: ts.sys.readDirectory,
		useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
			console.log(
				`Unrecoverable error in config file: ${pc.red(pc.underline(diagnostic.messageText as string))}`
			);
			process.exit(1);
		}
	};
}
