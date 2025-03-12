import * as ts from 'typescript';

/**
 * Resolves an import using TypeScript's module resolution algorithm
 */
export function resolveWithTs(
	importPath: string,
	importerPath: string | undefined,
	compilerOptions: ts.CompilerOptions
): string | null {
	if (typeof importerPath !== 'string') {
		return null;
	}

	const { resolvedModule } = ts.nodeModuleNameResolver(
		importPath,
		importerPath,
		compilerOptions,
		ts.sys
	);

	return resolvedModule?.resolvedFileName ?? null;
}
