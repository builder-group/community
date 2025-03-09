import path from 'node:path';
import type { PackageJson } from 'type-fest';

/**
 * Resolves bundle paths from package.json, handling both conditional exports
 * and standard package.json fields.
 *
 * Supports:
 * 1. Conditional exports
 * 2. Standard fields (main, module, types)
 * 3. Source field for TypeScript input
 *
 * @example Conditional exports:
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "import": "./dist/esm/index.js",
 *       "require": "./dist/cjs/index.js",
 *       "types": "./dist/types/index.d.ts",
 *       "source": "./src/index.ts"
 *     }
 *   }
 * }
 * ```
 *
 * @example Standard fields:
 * ```json
 * {
 *   "main": "./dist/cjs/index.js",
 *   "module": "./dist/esm/index.js",
 *   "types": "./dist/types/index.d.ts",
 *   "source": "./src/index.ts"
 * }
 * ```
 */
export function resolvePkgJsonBundlePaths(
	pkgJson: PackageJson,
	config: TResolvePkgJsonBundlePathConfig
): TBundlePath[] {
	const paths: TBundlePath[] = [];

	// Handle exports field (conditional exports)
	if (pkgJson.exports != null) {
		const exports = pkgJson.exports;

		// Handle object exports
		if (isExportConditions(exports)) {
			// Check for nested conditions
			Object.entries(exports).forEach(([_, conditions]) => {
				if (isExportConditions(conditions)) {
					paths.push(
						resolveBundlePath(conditions, {
							...config,
							fieldMap: FORMAT_FIELD_MAP.conditional
						})
					);
				}
			});
		}
		// Handle array exports
		else if (Array.isArray(exports)) {
			exports.forEach((entry) => {
				if (isExportConditions(entry)) {
					paths.push(
						resolveBundlePath(entry, {
							...config,
							fieldMap: FORMAT_FIELD_MAP.conditional
						})
					);
				}
			});
		}
	}

	// Fallback to standard fields if no paths found
	if (paths.length === 0 && isExportConditions(pkgJson)) {
		paths.push(
			resolveBundlePath(pkgJson, {
				...config,
				fieldMap: FORMAT_FIELD_MAP.standard
			})
		);
	}

	return paths;
}

function resolveBundlePath(
	conditions: PackageJson.ExportConditions,
	config: TResolveBundlePathConfig
): TBundlePath {
	return {
		input: resolveInputPath(conditions, config),
		output: resolveOutputPath(conditions, config)
	};
}

function resolveInputPath(
	conditions: PackageJson.ExportConditions,
	config: TResolveBundlePathConfig
): string {
	const { resolvePath, fieldMap } = config;

	// Get path from conditions using provided field map
	let sourcePath = './src/index.ts';
	const configuredPath = conditions[fieldMap.source];
	if (typeof configuredPath === 'string') {
		sourcePath = configuredPath;
	}

	return resolvePath ? path.resolve(process.cwd(), sourcePath) : sourcePath;
}

function resolveOutputPath(
	conditions: PackageJson.ExportConditions,
	config: TResolveBundlePathConfig
): string {
	const { format, preserveModules, resolvePath, fieldMap } = config;

	// Get path from conditions using provided field map
	let outputPath = `./dist/${format}/index.js`;
	const configuredPath = conditions[fieldMap[format]];
	if (typeof configuredPath === 'string') {
		outputPath = configuredPath;
	}

	// Remove '/index.js' if bundling to directory
	if (preserveModules) {
		outputPath = outputPath.replace(/\/[^/]*\.js$/, '');
	}

	return resolvePath ? path.resolve(process.cwd(), outputPath) : outputPath;
}

function isExportConditions(value: unknown): value is PackageJson.ExportConditions {
	return typeof value === 'object' && value !== null;
}

export interface TBundlePath {
	input: string;
	output: string;
}

export interface TResolvePkgJsonBundlePathConfig {
	format: 'esm' | 'cjs' | 'types';
	preserveModules: boolean;
	resolvePath: boolean;
}

export interface TResolveBundlePathConfig extends TResolvePkgJsonBundlePathConfig {
	fieldMap: TFormatFieldMap;
}

type TFormatFieldMap = {
	esm: string;
	cjs: string;
	types: string;
	source: string;
};

const FORMAT_FIELD_MAP = {
	// Conditional exports field mapping
	conditional: {
		esm: 'import',
		cjs: 'require',
		types: 'types',
		source: 'source'
	} satisfies TFormatFieldMap,
	// Standard package.json field mapping
	standard: {
		esm: 'module',
		cjs: 'main',
		types: 'types',
		source: 'source'
	} satisfies TFormatFieldMap
} as const;
