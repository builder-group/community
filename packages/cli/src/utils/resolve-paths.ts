import type { PackageJson } from 'type-fest';

import { resolvePathsFromPackageJson } from './resolve-paths-from-package-json';
import { toArray } from './to-array';

export function resolvePaths(config: {
	paths: TInputOutputPath | TInputOutputPath[] | null;
	packageJson: PackageJson;
	format: 'cjs' | 'esm' | 'types';
	preserveModules: boolean;
}): TInputOutputPath[] {
	const { paths, packageJson, format, preserveModules } = config;
	const finalPaths: TInputOutputPath[] = [];

	if (paths != null) {
		finalPaths.push(...toArray(paths));
	} else {
		finalPaths.push(...resolvePathsFromPackageJson(packageJson, { format, preserveModules }));
	}

	return finalPaths;
}

export interface TInputOutputPath {
	output: string;
	input: string;
	key?: string;
}
