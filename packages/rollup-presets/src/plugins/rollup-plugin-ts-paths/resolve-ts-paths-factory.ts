import path from 'node:path';
import * as ts from 'typescript';
import { getTsConfigCompilerOptions } from './get-ts-config-compiler-options';

/**
 * Creates a function that resolves TypeScript path aliases based on tsconfig.json
 */
export function resolveTsPathsFactory(
	options: TResolveTsPathsFactoryOptions = {}
): (importee: string, importer?: string) => string | null {
	const {
		nonRelative = false,
		transform,
		shouldResolveRelativeToImporter = false,
		resolveDTsSource = false
	} = options;

	const compilerOptions = resolveCompilerOptions(options);
	const { paths: compilerPaths, baseUrl } = compilerOptions;

	return (importee: string, importer?: string): string | null => {
		if (!shouldResolveImport(importee, importer, compilerPaths, baseUrl, nonRelative)) {
			return null;
		}

		// Resolve the module using TypeScript's resolution
		const resolved = resolveWithTypeScript(importee, importer, compilerOptions);
		if (resolved == null) {
			return null;
		}

		// Handle .d.ts resolution if enabled
		const targetPath = resolveDTsSource ? resolveSourceFile(resolved) : resolved;
		if (targetPath == null) {
			return null;
		}

		// Format the final path
		const finalPath = formatPath(targetPath, importer, shouldResolveRelativeToImporter);
		return transform != null ? transform(finalPath) : finalPath;
	};
}

function resolveCompilerOptions(options: TResolveTsPathsFactoryOptions): ts.CompilerOptions {
	const { tsConfigPath, compilerOptions = {} } = options;

	if (tsConfigPath != null) {
		return {
			...getTsConfigCompilerOptions(tsConfigPath),
			...compilerOptions
		};
	}

	return compilerOptions;
}

function shouldResolveImport(
	importee: string,
	importer: string | undefined,
	paths: ts.CompilerOptions['paths'],
	baseUrl: ts.CompilerOptions['baseUrl'],
	nonRelative: boolean
): boolean {
	const isEnabled = paths != null || (baseUrl != null && nonRelative);

	if (
		!isEnabled ||
		typeof importer !== 'string' ||
		typeof importee !== 'string' ||
		// Skip processing virtual Rollup modules (those starting with '\0')
		importee.startsWith('\0') ||
		// Can't resolve relative modules, only non-relative
		importee.startsWith('.')
	) {
		return false;
	}

	// Check if importee matches any TypeScript path alias
	const hasMatchingPath = Object.keys(paths as object).some((tsPath) =>
		new RegExp(`^${tsPath.replace('*', '.+')}$`).test(importee)
	);

	return hasMatchingPath || nonRelative;
}

function resolveWithTypeScript(
	importee: string,
	importer: string | undefined,
	compilerOptions: ts.CompilerOptions
): string | null {
	if (typeof importer !== 'string') {
		return null;
	}

	const { resolvedModule } = ts.nodeModuleNameResolver(importee, importer, compilerOptions, ts.sys);

	return resolvedModule?.resolvedFileName ?? null;
}

function resolveSourceFile(fileName: string): string | null {
	if (!fileName.endsWith('.d.ts')) {
		return fileName;
	}

	// Try to find corresponding JS file
	const jsFile = fileName.replace(/\.d\.ts$/, '.js');
	if (ts.sys.fileExists(jsFile)) {
		return jsFile;
	}

	// Try to find corresponding WASM file
	const wasmFile = fileName.replace(/(?:\.wasm)?\.d\.ts$/, '.wasm');
	if (ts.sys.fileExists(wasmFile)) {
		return wasmFile;
	}

	return null;
}

function formatPath(
	filePath: string,
	importer: string | undefined,
	shouldResolveRelative: boolean | ((source: string, importer: string | undefined) => boolean)
): string {
	const shouldMakeRelative =
		typeof shouldResolveRelative === 'function'
			? shouldResolveRelative(filePath, importer)
			: shouldResolveRelative;

	if (!shouldMakeRelative || !importer) {
		return ts.sys.resolvePath(filePath);
	}

	let relativePath = path.relative(path.dirname(importer), filePath);
	if (!relativePath.startsWith('../') && !relativePath.startsWith('/')) {
		relativePath = `./${relativePath}`;
	}

	return relativePath;
}

export interface TResolveTsPathsFactoryOptions {
	/**
	 * Resolve non-relative paths based on tsconfig's baseUrl, even if no paths match
	 *
	 * @see {@link https://www.typescriptlang.org/docs/handbook/module-resolution.html#relative-vs-non-relative-module-imports}
	 * @see {@link https://www.typescriptlang.org/docs/handbook/module-resolution.html#base-url}
	 * @default false
	 */
	nonRelative?: boolean;

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
	 * Resolve paths relative to importing file
	 */
	shouldResolveRelativeToImporter?:
		| boolean
		| ((source: string, importer: string | undefined) => boolean);

	/**
	 * Resolve .d.ts files to their source files
	 */
	resolveDTsSource?: boolean;
}
