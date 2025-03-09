import * as ts from 'typescript';

export function getTsConfigPath(prefixes: (string | null)[] = [null]): string | null {
	const cwd = process.cwd();

	for (const prefix of prefixes) {
		const configName = prefix != null ? `tsconfig.${prefix}.json` : 'tsconfig.json';
		const tsConfigPath = ts.findConfigFile(cwd, ts.sys.fileExists, configName);

		if (tsConfigPath) {
			return tsConfigPath;
		}
	}

	return null;
}
