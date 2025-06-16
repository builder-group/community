import path from 'node:path';
import pc from 'picocolors';
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
	const { pkgJson, format, debug = false } = options;
	const moduleExports = filterSubpathExports(pkgJson.exports);

	return {
		name: 'cross-module-imports',

		resolveId(source: string, importer: string | undefined) {
			if (importer == null || source == null) {
				return null;
			}

			// Only handle imports that go up at least one directory (cross-module imports)
			if (!source.startsWith('../')) {
				return null;
			}

			// Convert paths to a common format
			const importerDir = path.dirname(importer);
			const absoluteSource = path.resolve(importerDir, source);
			const relativeImporter = path.relative(process.cwd(), importer);
			const relativeSource = path.relative(process.cwd(), absoluteSource);

			// Identify which modules are involved
			const importerModule = getModuleFromPath(relativeImporter, moduleExports);
			const targetModule = getModuleFromPath(relativeSource, moduleExports);

			if (debug) {
				console.log('\n');
				console.log(pc.dim('=== Resolving Import ==='));
				console.log(pc.dim(`Source: ${source}`));
				console.log(pc.dim(`Importer: ${importer}`));
				console.log(pc.dim(`Importer Module: ${importerModule}`));
				console.log(pc.dim(`Target Module: ${targetModule}`));
			}

			// Only process cross-module imports
			if (targetModule == null || importerModule === targetModule) {
				return null;
			}

			// Get the export config for the target module
			const exportConfig = moduleExports[`./${targetModule}`];
			if (exportConfig == null) {
				return null;
			}

			// Get the appropriate output path based on format (esm/cjs)
			const outputPath = format === 'esm' ? exportConfig.import : exportConfig.require;
			if (outputPath == null) {
				return null;
			}

			// Calculate how many levels deep the importing file is
			const importerNesting = path.relative(process.cwd(), importerDir).split('/').length - 1;

			// Extract the build structure (e.g., "adapter/esm" from "./dist/adapter/esm/index.js")
			const outputParts = normalizePath(outputPath).split('/');
			const buildPath = outputParts.slice(1, -1).join('/');

			// Extract any specific path after the module name
			const normalizedSource = normalizePath(relativeSource);
			const normalizedExportSource = normalizePath(exportConfig.source);
			const moduleDir = path.dirname(normalizedExportSource);

			// If source is longer than the module path, it's importing a specific file
			const specificPath = normalizedSource.startsWith(moduleDir)
				? normalizedSource.slice(moduleDir.length)
				: '';

			const relativePath = `${'../'.repeat(importerNesting + 1)}${buildPath}${specificPath}`;

			if (debug) {
				console.log(pc.dim(`Found export config for: ${targetModule}`));
				console.log(pc.dim(`Format: ${format}`));
				console.log(pc.dim(`Source Path: ${exportConfig.source}`));
				console.log(pc.dim(`Output Path: ${outputPath}`));
				console.log(pc.dim(`Build Path: ${buildPath}`));
				console.log(pc.dim(`Module Dir: ${moduleDir}`));
				console.log(pc.dim(`Specific Path: ${specificPath}`));
				console.log(pc.dim(`Importer Nesting: ${importerNesting}`));
				console.log(pc.dim(`Final Path: ${relativePath}`));
			}

			return {
				id: relativePath,
				external: true // Mark as external to prevent bundling
			};
		}
	};
}

/**
 * Validates and filters package.json exports to ensure they match our supported format:
 * ```json
 * {
 *   "./module1": {
 *     "source": "./src/module1/index.ts",
 *     "import": "./dist/module1/esm/index.js",
 *     "require": "./dist/module1/cjs/index.js"
 *   }
 * }
 * ```
 *
 * - Only accepts subpath exports (e.g., "./module1")
 * - Requires source, import, and require fields
 * - Skips special exports like "." and "./package.json"
 *
 * @throws {Error} If exports format is invalid or unsupported
 */
function filterSubpathExports(exports: PackageJson['exports']): TSubpathExports {
	if (exports == null || typeof exports !== 'object') {
		return {};
	}

	const validExports: Record<string, TSubpathExportConfig> = {};
	for (const [key, config] of Object.entries(exports)) {
		// Skip special exports
		if (key === '.' || key === './package.json') {
			continue;
		}

		// Validate export key format (must be "./something")
		if (!key.startsWith('./')) {
			continue;
		}

		// Validate export config
		if (!isValidSubpathConfig(config)) {
			continue;
		}

		validExports[key] = config;
	}

	return validExports;
}

/**
 * Type guard to validate export config matches our required format.
 * @returns true if config has all required fields with correct format
 */
function isValidSubpathConfig(config: unknown): config is TSubpathExportConfig {
	if (config == null || typeof config !== 'object') {
		return false;
	}

	const { source, import: esm, require: cjs } = config as Record<string, unknown>;
	return (
		typeof source === 'string' &&
		typeof esm === 'string' &&
		typeof cjs === 'string' &&
		source.startsWith('./') &&
		esm.startsWith('./') &&
		cjs.startsWith('./')
	);
}

/**
 * Extracts module name from a file path by matching against exports config.
 * @example
 * // With exports: { './module1': { source: './src/module1/index.ts' } }
 * getModuleFromPath('src/module1/nested/file.ts') => 'module1'
 */
function getModuleFromPath(filePath: string, exports: TSubpathExports): string | null {
	const normalizedPath = normalizePath(filePath);

	for (const [exportKey, config] of Object.entries(exports)) {
		const sourcePath = normalizePath(config.source);
		const sourceDir = path.dirname(sourcePath);

		if (normalizedPath.startsWith(sourceDir)) {
			return exportKey.replace(/^\.\//, '');
		}
	}
	return null;
}

/**
 * Normalizes file paths for consistent comparison.
 * - Removes leading './' if present
 * - Converts Windows backslashes to forward slashes
 * - Preserves relative paths (e.g., '../')
 */
function normalizePath(p: string): string {
	return p.replace(/^\.\//, '').replace(/\\/g, '/');
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

	/**
	 * Whether to log detailed debug information
	 */
	debug?: boolean;
}

interface TSubpathExportConfig {
	/** Source file path (e.g., "./src/module1/index.ts") */
	source: string;
	/** ESM build output path (e.g., "./dist/module1/esm/index.js") */
	import: string;
	/** CJS build output path (e.g., "./dist/module1/cjs/index.js") */
	require: string;
	/** Optional TypeScript types path */
	types?: string;
}

type TSubpathExports = Record<string, TSubpathExportConfig>;
