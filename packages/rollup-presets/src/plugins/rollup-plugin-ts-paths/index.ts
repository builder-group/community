import path from 'node:path';
import type { Plugin } from 'rollup';
import * as ts from 'typescript';
import { getTsConfigCompilerOptions, resolveWithTs } from '../../lib';

export function tsPathsPlugin(options: TTsPathsPluginOptions = {}): Plugin {
	const {
		allowNonRelative = false,
		transform,
		resolveRelative = false,
		resolveDTsSource = false,
		tsConfigPath
	} = options;
	const compilerOptions = {
		...getTsConfigCompilerOptions(tsConfigPath),
		...options.compilerOptions
	};

	return {
		name: 'ts-paths',
		resolveId: (importPath: string, importerPath?: string): string | null => {
			if (
				typeof importerPath !== 'string' ||
				typeof importPath !== 'string' ||
				// Skip virtual Rollup modules
				importPath.startsWith('\0') ||
				// Skip relative imports
				importPath.startsWith('.')
			) {
				return null;
			}

			// Check if paths resolution is enabled and has a matching pattern
			const isPathsEnabled =
				compilerOptions.paths != null &&
				Object.keys(compilerOptions.paths).some((pathPattern) =>
					new RegExp(`^${pathPattern.replace('*', '.+')}$`).test(importPath)
				);

			// Check if non-relative resolution is enabled and baseUrl is set
			const isallowNonRelativeEnabled = compilerOptions.baseUrl != null && allowNonRelative;

			if (!isPathsEnabled && !isallowNonRelativeEnabled) {
				return null;
			}

			// Resolve the file using TypeScript's resolution
			let resolvedFile = resolveWithTs(importPath, importerPath, compilerOptions);
			if (resolvedFile == null) {
				return null;
			}

			// Handle .d.ts source files if enabled
			if (resolveDTsSource) {
				resolvedFile = resolveSourceFromDts(resolvedFile);
			}
			if (resolvedFile == null) {
				return null;
			}

			// Process the path, potentially making it relative to the importer
			resolvedFile = processPath(resolvedFile, importerPath, resolveRelative);

			return transform != null ? transform(resolvedFile) : resolvedFile;
		}
	};
}

/**
 * For .d.ts files, tries to find the corresponding source file (.js, .wasm)
 */
function resolveSourceFromDts(filePath: string): string | null {
	if (!filePath.endsWith('.d.ts')) {
		return filePath;
	}

	const jsFile = filePath.replace(/\.d\.ts$/, '.js');
	if (ts.sys.fileExists(jsFile)) {
		return jsFile;
	}

	const wasmFile = filePath.replace(/(?:\.wasm)?\.d\.ts$/, '.wasm');
	if (ts.sys.fileExists(wasmFile)) {
		return wasmFile;
	}

	return null;
}

/**
 * Process the path, potentially making it relative to the importer
 */
function processPath(
	filePath: string,
	importerPath: string,
	resolveRelative: TTsPathsPluginOptions['resolveRelative']
): string {
	const makeRelative =
		typeof resolveRelative === 'function'
			? resolveRelative(filePath, importerPath)
			: resolveRelative;

	// If not making relative, return absolute path
	if (!makeRelative) {
		return ts.sys.resolvePath(filePath);
	}

	// Create a path relative to the importer
	let relativePath = path.relative(path.dirname(importerPath), filePath);
	if (!relativePath.startsWith('../') && !relativePath.startsWith('./')) {
		relativePath = `./${relativePath}`;
	}

	return relativePath;
}

export interface TTsPathsPluginOptions {
	/**
	 * Path to tsconfig.json file
	 */
	tsConfigPath?: string;

	/**
	 * Compiler options that override tsconfig.json
	 */
	compilerOptions?: ts.CompilerOptions;

	/**
	 * Transform resolved paths before returning
	 */
	transform?: (path: string) => string;

	/**
	 * Whether to resolve paths relative to importing file
	 */
	resolveRelative?: boolean | ((source: string, importer?: string) => boolean);

	/**
	 * Whether to resolve .d.ts files to their source files
	 */
	resolveDTsSource?: boolean;

	/**
	 * Whether to allow resolving non-relative imports (without ./ or ../) using tsconfig's baseUrl
	 * even when they don't match any paths patterns.
	 *
	 * @see {@link https://www.typescriptlang.org/docs/handbook/module-resolution.html}
	 * @default false
	 */
	allowNonRelative?: boolean;
}
