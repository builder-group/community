import path from 'node:path';
import type { PackageJson } from 'type-fest';

/**
 * Resolves bundle paths from package.json, handling both exports field
 * and top-level package.json fields.
 *
 * Supports:
 * 1. Top-level fields (main, module, types)
 * 2. Exports field with top level conditions
 * 3. Source field for TypeScript input
 *
 * @example Top-level fields:
 * ```json
 * {
 *   "main": "./dist/cjs/index.js",
 *   "module": "./dist/esm/index.js",
 *   "types": "./dist/types/index.d.ts",
 *   "source": "./src/index.ts"
 * }
 * ```
 *
 * @example Exports with top level conditions:
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "source": "./src/index.ts",
 *       "import": "./dist/index.mjs",
 *       "require": "./dist/index.cjs"
 *     }
 *   }
 * }
 * ```
 *
 * @example Exports with top level conditions and subpath:
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "import": {
 *         "types": "./dist/types/index.d.mts",
 *         "default": "./dist/index.mjs"
 *       },
 *       "require": {
 *         "types": "./dist/types/index.d.cts",
 *         "default": "./dist/index.cjs"
 *       }
 *     }
 *   }
 * }
 * ```
 */
export function resolvePkgJsonBundlePaths(
	pkgJson: PackageJson,
	config: TResolvePkgJsonBundlePathConfig
): TBundlePath[] {
	const paths: TBundlePath[] = [];

	// Handle exports field
	if (pkgJson.exports != null) {
		paths.push(...resolveExports(pkgJson.exports, config));
	}

	// Fallback to top-level fields if no paths found
	if (paths.length === 0 && hasTopLevelFields(pkgJson)) {
		paths.push(
			resolveBundlePath(pkgJson, {
				...config,
				fieldMap: FORMAT_FIELD_MAP.topLevel
			})
		);
	}

	return paths;
}

function resolveExports(
	exports: PackageJson.Exports,
	config: TResolvePkgJsonBundlePathConfig
): TBundlePath[] {
	const paths: TBundlePath[] = [];

	// Handle array exports
	if (Array.isArray(exports)) {
		exports.forEach((entry) => {
			if (hasExportConditions(entry)) {
				const bundlePaths = resolveExportEntry('.', entry, config);
				if (bundlePaths != null) {
					paths.push(...bundlePaths);
				}
			}
		});
		return paths;
	}

	// Handle object exports
	if (typeof exports === 'object' && exports != null) {
		Object.entries(exports).forEach(([key, entry]) => {
			if (hasExportConditions(entry)) {
				const bundlePaths = resolveExportEntry(key, entry, config);
				if (bundlePaths != null) {
					paths.push(...bundlePaths);
				}
			}
		});
	}

	return paths;
}

function resolveExportEntry(
	key: string,
	conditions: PackageJson.ExportConditions,
	config: TResolvePkgJsonBundlePathConfig
): TBundlePath[] {
	const formatKey = FORMAT_FIELD_MAP.exports[config.format];
	const formatCondition = conditions[formatKey];

	// Handle nested format with types
	if (hasSubpathConditions(formatCondition)) {
		return [
			resolveBundlePath(formatCondition, {
				...config,
				key,
				fieldMap: FORMAT_FIELD_MAP.exportsSubpath
			})
		];
	}

	// Handle direct format path
	if (typeof formatCondition === 'string') {
		return [
			resolveBundlePath(conditions, {
				...config,
				key,
				fieldMap: FORMAT_FIELD_MAP.exports
			})
		];
	}

	// Handle special case for types format in subpaths
	if (formatKey === 'types') {
		const exportEntries: TBundlePath[] = [];

		const getExportEntry = (format: 'esm' | 'cjs') => {
			const formatCondition = conditions[FORMAT_FIELD_MAP.exports[format]];
			if (!hasSubpathConditions(formatCondition)) {
				return null;
			}
			return resolveExportEntry(key, formatCondition, config)?.[0] ?? null;
		};

		(['esm', 'cjs'] as const).forEach((format) => {
			const entry = getExportEntry(format);
			if (entry != null) {
				exportEntries.push(entry);
			}
		});

		return exportEntries;
	}

	return [];
}

function resolveBundlePath(
	conditions: PackageJson.ExportConditions,
	config: TResolveBundlePathConfig & { key?: string }
): TBundlePath {
	const { path: output, extension } = resolveOutputPath(conditions, config);

	return {
		key: config.key,
		input: resolveInputPath(conditions, config),
		output,
		format: config.format,
		extension
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
): { path: string; extension: `.${string}` } {
	const { format, preserveModules, resolvePath, fieldMap } = config;

	// Get path from conditions using provided field map
	let extension: `.${string}` = `.${format === 'esm' ? 'mjs' : 'cjs'}`;
	let outputPath = `./dist/${format}/index.${extension}`;
	const configuredPath = conditions[fieldMap[format]];
	if (typeof configuredPath === 'string') {
		outputPath = configuredPath;
		extension = path.extname(outputPath) as `.${string}`;
	}

	// Remove '/index.js' if bundling to directory
	if (preserveModules) {
		outputPath = outputPath.replace(/\/[^/]*\.(?:mjs|cjs|js)$/, '');
	}

	return {
		path: resolvePath ? path.resolve(process.cwd(), outputPath) : outputPath,
		extension
	};
}

/**
 * Checks if the value has top-level package.json fields (main, module, types)
 */
function hasTopLevelFields(value: unknown): value is PackageJson.ExportConditions {
	if (typeof value !== 'object' || value == null) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	return (
		typeof obj['main'] === 'string' ||
		typeof obj['module'] === 'string' ||
		typeof obj['types'] === 'string'
	);
}

/**
 * Checks if the value has exports field conditions (import, require)
 */
function hasExportConditions(value: unknown): value is PackageJson.ExportConditions {
	if (typeof value !== 'object' || value == null) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	return (
		typeof obj['import'] === 'string' ||
		typeof obj['require'] === 'string' ||
		typeof obj['types'] === 'string' ||
		hasSubpathConditions(obj['import']) ||
		hasSubpathConditions(obj['require'])
	);
}

/**
 * Checks if the value has subpath conditions (default, types)
 */
function hasSubpathConditions(value: unknown): value is PackageJson.ExportConditions {
	if (typeof value !== 'object' || value == null) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	return typeof obj['default'] === 'string' || typeof obj['types'] === 'string';
}

export interface TBundlePath {
	/**
	 * Input path (source file)
	 */
	input: string;

	/**
	 * Output path (bundle destination)
	 */
	output: string;

	/**
	 * Export key (e.g. '.' or './utils') when using exports field
	 */
	key?: string;

	/**
	 * Format of the bundle (esm, cjs or types)
	 */
	format: 'esm' | 'cjs' | 'types';

	/**
	 * File extension of the output file (e.g. '.mjs', '.cjs', '.js')
	 */
	extension: `.${string}`;
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
	// Top-level package.json fields
	topLevel: {
		esm: 'module',
		cjs: 'main',
		types: 'types',
		source: 'source'
	} satisfies TFormatFieldMap,
	// Exports field conditions
	exports: {
		esm: 'import',
		cjs: 'require',
		types: 'types',
		source: 'source'
	} satisfies TFormatFieldMap,
	// Exports subpath
	exportsSubpath: {
		esm: 'default',
		cjs: 'default',
		types: 'types',
		source: 'source'
	} satisfies TFormatFieldMap
} as const;
