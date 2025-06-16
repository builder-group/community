import path from 'node:path';
import type { Plugin } from 'rollup';
import type { PackageJson } from 'type-fest';

/**
 * Creates a Rollup plugin that handles cross-module imports within a monorepo package.
 * Uses package.json exports to transform relative imports between modules to their build paths.
 *
 * @example
 * ```ts
 * // package.json
 * {
 *   "exports": {
 *     "./module1": {
 *       "source": "./src/module1/index.ts",
 *       "import": "./dist/module1/esm/index.js"
 *     }
 *   }
 * }
 *
 * // Input (src/module2/nested/index.ts)
 * import { something } from '../../module1';
 * import { internal } from '../../module1/internal';
 *
 * // Output
 * import { something } from '../../../module1/esm';
 * import { internal } from '../../../module1/esm/internal';
 * ```
 */
export function createCrossModuleImportPlugin(options: TCrossModuleImportOptions): Plugin {
	const { pkgJson, format } = options;

	// Pre-process exports
	const moduleExports = Object.entries(pkgJson.exports ?? {}).reduce<TModuleExports>(
		(acc, [key, config]) => {
			if (
				// Skip root export
				key === '.' ||
				// Skip package.json
				key === './package.json' ||
				// Skip non-relative imports
				!key.startsWith('./')
			) {
				return acc;
			}

			// Validate export config
			if (!isValidExportConfig(config)) {
				return acc;
			}

			// Store normalized paths for faster lookup
			const moduleName = key.replace(/^\.\//, '');
			acc[moduleName] = {
				source: normalizePath(config.source),
				output: normalizePath(format === 'esm' ? config.import : config.require)
			};

			return acc;
		},
		{}
	);

	return {
		name: 'cross-module-imports',
		resolveId(importPath: string, importerPath?: string): { id: string; external: true } | null {
			if (
				typeof importerPath !== 'string' ||
				typeof importPath !== 'string' ||
				// Skip virtual modules
				importPath.startsWith('\0') ||
				// Only handle relative imports
				!importPath.startsWith('../')
			) {
				return null;
			}

			// Find the modules involved in the import
			const modules = findModules(importPath, importerPath, moduleExports);
			if (modules == null) {
				return null;
			}

			// Calculate the final import path
			const resolvedPath = resolveImportPath(modules);
			if (resolvedPath == null) {
				return null;
			}

			return {
				id: resolvedPath,
				external: true
			};
		}
	};
}

/**
 * Type guard to validate export config structure and paths.
 * Ensures all required fields are present and paths start with './'.
 */
function isValidExportConfig(config: unknown): config is TExportConfig {
	return (
		config != null &&
		typeof config === 'object' &&
		'source' in config &&
		'import' in config &&
		'require' in config &&
		typeof config.source === 'string' &&
		typeof config.import === 'string' &&
		typeof config.require === 'string' &&
		config.source.startsWith('./') &&
		config.import.startsWith('./') &&
		config.require.startsWith('./')
	);
}

/**
 * Normalizes a path by removing leading './' and converting backslashes to forward slashes.
 */
function normalizePath(p: string): string {
	return p.replace(/^\.\//, '').replace(/\\/g, '/');
}

/**
 * Finds the target and importer modules involved in an import.
 * Returns null if either module cannot be found.
 */
function findModules(
	importPath: string,
	importerPath: string,
	exports: TModuleExports
): TModuleMatch | null {
	// Convert paths to absolute for comparison
	const importerDir = path.dirname(importerPath);
	const absoluteSource = path.resolve(importerDir, importPath);
	const relativeSource = path.relative(process.cwd(), absoluteSource);
	const normalizedSource = normalizePath(relativeSource);

	// Find target module (the one being imported)
	const targetModule = Object.entries(exports).find(([_, paths]) => {
		const sourceDir = path.dirname(paths.source);
		return normalizedSource.startsWith(sourceDir);
	});

	// Find importer module
	const importerModule = Object.entries(exports).find(([_, paths]) => {
		const sourceDir = path.dirname(paths.source);
		return normalizePath(importerPath).includes(sourceDir);
	});

	if (!targetModule || !importerModule) {
		return null;
	}

	const [targetName, targetPaths] = targetModule;
	const [importerName, importerPaths] = importerModule;

	// Calculate specific path and nesting level
	const baseDir = path.dirname(targetPaths.source);
	const specificPath = normalizedSource.startsWith(baseDir)
		? normalizedSource.slice(baseDir.length)
		: '';
	const nesting = path.relative(process.cwd(), path.dirname(importerPath)).split('/').length - 1;

	return {
		target: {
			name: targetName,
			paths: targetPaths,
			specificPath
		},
		importer: {
			name: importerName,
			paths: importerPaths,
			nesting
		}
	};
}

/**
 * Extracts the output format structure (everything after the module name).
 * Example: For 'dist/adapter/esm/v2/index.js', returns '/esm/v2/index.js'
 */
function extractOutputFormat(outputPath: string, moduleName: string): string {
	const parts = outputPath.split('/');
	const moduleIndex = parts.indexOf(moduleName);
	if (moduleIndex === -1) {
		return '';
	}
	return `/${parts.slice(moduleIndex + 1).join('/')}`;
}

/**
 * Constructs the final output path based on whether this is a module import or file import:
 *
 * For module imports (e.g., '../adapter'):
 * - Uses the outputFormat as is (e.g., 'dist/adapter/esm/index.js')
 *
 * For file imports (e.g., '../adapter/utils'):
 * - Replaces the last segment of outputFormat with the specific file path
 * - Example:
 *   outputFormat = 'dist/adapter/esm/index.js'
 *   specificPath = '/utils'
 *   Result = 'dist/adapter/esm/utils.js'
 */
function resolveImportPath(modules: TModuleMatch): string | null {
	const { target, importer } = modules;
	const isModuleImport = !target.specificPath || target.specificPath === '/index';

	// Get output format (everything after module name)
	const outputFormat = extractOutputFormat(target.paths.output, target.name);
	if (outputFormat === '') {
		return null;
	}

	// For specific files, replace the last segment
	const outputPath = isModuleImport
		? outputFormat
		: outputFormat.replace(
				/\/[^/]+$/,
				`${target.specificPath}${path.extname(target.paths.output)}`
			);

	// Construct the final path
	return `${'../'.repeat(importer.nesting + 1)}${target.name}${outputPath}`;
}

interface TCrossModuleImportOptions {
	/**
	 * Package.json contents used to resolve module exports paths
	 */
	pkgJson: PackageJson;

	/**
	 * Current bundle format being built
	 */
	format: 'esm' | 'cjs';
}

interface TExportConfig {
	/** Source file path (e.g., "./src/module1/index.ts") */
	source: string;
	/** ESM build output path (e.g., "./dist/module1/esm/index.js") */
	import: string;
	/** CJS build output path (e.g., "./dist/module1/cjs/index.js") */
	require: string;
	/** Optional TypeScript types path */
	types?: string;
}

interface TModulePaths {
	/** Source file path (e.g., "./src/module1/index.ts") */
	source: string;
	/** ESM/CJS build output path (e.g., "./dist/module1/esm/index.js") */
	output: string;
}

interface TModuleMatch {
	target: {
		name: string;
		paths: TModulePaths;
		specificPath: string;
	};
	importer: {
		name: string;
		paths: TModulePaths;
		nesting: number;
	};
}

type TModuleExports = Record<string, TModulePaths>;
