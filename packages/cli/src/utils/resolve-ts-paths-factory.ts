import path from 'node:path';
import * as ts from 'typescript';

import type { DynCommand } from '../DynCommand';
import {
	getTsConfigCompilerOptions,
	type TTsConfigCompilerOptions
} from './get-ts-config-compiler-options';

export function resolveTsPathsFactory(
	command: DynCommand,
	options: TResolveTsPathsFactoryOptions = {}
): TResolveTsPaths {
	const {
		nonRelative = false,
		tsConfigPath,
		transform,
		shouldResolveRelativeToImporter = false,
		resolveDTsSource = false
	} = options;

	// Resolve compiler options
	let compilerOptions: TTsConfigCompilerOptions = {};
	if (options.compilerOptions != null) {
		compilerOptions = options.compilerOptions;
		if (typeof tsConfigPath === 'string') {
			compilerOptions = {
				...getTsConfigCompilerOptions(command, tsConfigPath),
				...compilerOptions
			};
		}
	} else if (typeof tsConfigPath === 'string') {
		compilerOptions = getTsConfigCompilerOptions(command, tsConfigPath);
	} else {
		compilerOptions = getTsConfigCompilerOptions(command);
	}

	return (importee: string, importer?: string) => {
		const compilerOptionsPaths = compilerOptions.paths;
		const isEnabled =
			compilerOptionsPaths != null || (compilerOptions.baseUrl != null && nonRelative);

		// Initial checks for import validity
		if (
			!isEnabled ||
			typeof importer !== 'string' ||
			typeof importee !== 'string' ||
			// Skip processing virtual Rollup modules (those starting with '\0')
			importee.startsWith('\0') ||
			// Can't resolve relative modules, only non-relative
			importee.startsWith('.')
		) {
			return null;
		}

		// Match importee against TypeScript paths to check if it's a valid alias
		const hasMatchingPath = Object.keys(compilerOptionsPaths as object).some((tsPath) =>
			new RegExp(`^${tsPath.replace('*', '.+')}$`).test(importee)
		);

		if (!hasMatchingPath && !nonRelative) {
			return null;
		}

		// Use Typescript's module resolution algorithm to find the correct file represented by the importee
		const { resolvedModule: { resolvedFileName } = {} } = ts.nodeModuleNameResolver(
			importee,
			importer,
			compilerOptions,
			ts.sys
		);
		if (resolvedFileName == null) {
			return null;
		}

		// Handle potential imported .d.ts files and try to resolve corresponding source file.
		// Required for 'rust_modules' where the generated code (from WASM-Pack) is no TS file
		// but instead a JS file and a declaration file.
		let targetFileName: string = resolvedFileName;
		if (resolveDTsSource) {
			if (resolvedFileName.endsWith('.d.ts')) {
				if (doesJsFileExist(resolvedFileName)) {
					targetFileName = resolvedFileName.replace(/\.d\.ts$/i, '.js');
				} else if (doesWasmFileExist(resolvedFileName)) {
					targetFileName = resolvedFileName.replace(/(?:\.wasm)?\.d\.ts$/, '.wasm');
				} else {
					return null;
				}
			}
		}

		// Resolve path to target file name
		let resolvedPath: string;
		if (
			(typeof shouldResolveRelativeToImporter === 'boolean' && shouldResolveRelativeToImporter) ||
			(typeof shouldResolveRelativeToImporter === 'function' &&
				shouldResolveRelativeToImporter(targetFileName, importer))
		) {
			resolvedPath = path.relative(path.dirname(importer), targetFileName);
			if (!resolvedPath.startsWith('../') && !resolvedPath.startsWith('/')) {
				resolvedPath = `./${resolvedPath}`;
			}
		} else {
			resolvedPath = ts.sys.resolvePath(targetFileName);
		}

		return transform ? transform(resolvedPath) : resolvedPath;
	};
}

function doesJsFileExist(fileName: string): boolean {
	const potentialJsFile = fileName.replace(/\.d\.ts$/, '.js');
	return ts.sys.fileExists(potentialJsFile);
}

function doesWasmFileExist(fileName: string): boolean {
	const potentialWasmFile = fileName.replace(/(?:\.wasm)?\.d\.ts$/, '.wasm');
	return ts.sys.fileExists(potentialWasmFile);
}

export interface TResolveTsPathsFactoryOptions {
	/**
	 * Determines if non-relative paths should be resolved based on the tsconfig's `baseUrl`.
	 * The path resolution occurs even if none of the `paths` are matched. By default, this is set to `false`.
	 * Useful in scenarios where the base URL and relative imports need to be considered.
	 *
	 * @see {@link https://www.typescriptlang.org/docs/handbook/module-resolution.html#relative-vs-non-relative-module-imports}
	 * @see {@link https://www.typescriptlang.org/docs/handbook/module-resolution.html#base-url}
	 */
	nonRelative?: boolean;

	/**
	 * Specifies the path to the `tsconfig.json` file.
	 *
	 * @example './path/to/tsconfig.json'
	 */
	tsConfigPath?: string;

	/*
	 * Specifies the compiler options directly
	 * which have a hiegher weight than the ones specified in the `tsconfig.json` file.
	 */
	compilerOptions?: TTsConfigCompilerOptions;

	/**
	 * A function that gets invoked when the plugin successfully resolves a path.
	 * It allows for custom transformation of the resolved path before it's returned.
	 *
	 * @param path - The resolved path.
	 * @returns The transformed path string.
	 */
	transform?: (path: string) => string;

	/**
	 * Determines if the resolved paths should be relative to the importing file.
	 */
	shouldResolveRelativeToImporter?:
		| boolean
		| ((source: string, importer: string | undefined) => boolean);

	/**
	 * Determines if .d.ts files should be resolved to their corresponding source files.
	 */
	resolveDTsSource?: boolean;
}

export type TResolveTsPaths = (importee: string, importer?: string) => string | null;
