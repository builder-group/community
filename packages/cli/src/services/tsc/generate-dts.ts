import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import type { PackageJson } from 'type-fest';
import type { DynCommand } from '../../DynCommand';
import {
	execaVerbose,
	findNearestTsConfigPath,
	getTsConfigCompilerOptions,
	resolvePathsFromPackageJson,
	resolveTsPathsFactory,
	type TResolveTsPaths,
	type TTsConfigCompilerOptions
} from '../../utils';

export async function generateDts(
	command: DynCommand,
	options: TGenerateDtsOptions = {}
): Promise<void> {
	const {
		tsConfigPath = findNearestTsConfigPath(),
		packageJson,
		shouldResolveTsPaths = true
	} = options;
	command.log(
		'🚀 Started generating Typescript Declaration files.',
		command.isVerbose
			? chalk.gray(
					JSON.stringify({
						args: [{ tsconfig: tsConfigPath }]
					})
				)
			: ''
	);

	// Resolve Typescript compiler options
	if (tsConfigPath == null) {
		command.error('No tsconfig.json found.', { exit: 1 });
	}
	const compilerOptions = getTsConfigCompilerOptions(command, tsConfigPath);

	// Generate declaration files
	await execaVerbose('pnpm', ['tsc', '--emitDeclarationOnly', '--project', tsConfigPath], {
		command
	});

	// Handle Typescript paths like `{"@/rust/*": ["./src/rust_modules/*"]}`
	if (shouldResolveTsPaths && compilerOptions.paths != null) {
		const relativeDeclarationDirPath = getRelativeDeclarationDirPath(compilerOptions, packageJson);
		const declarationFileEnding = '.d.ts';
		const resolveTsPaths = resolveTsPathsFactory(command, {
			compilerOptions: adjustCompilerOptionsForResolvedPaths(
				compilerOptions,
				relativeDeclarationDirPath
			),
			shouldResolveRelativeToImporter: true
		});

		// Update import paths in declaration files
		const declarationFilePaths = getFilePathsWithExtDeep(
			relativeDeclarationDirPath,
			declarationFileEnding
		);
		for (const filePath of declarationFilePaths) {
			let content = fs.readFileSync(filePath, 'utf-8');
			content = updateImportPaths(content, filePath, resolveTsPaths);
			content = updateExportPaths(content, filePath, resolveTsPaths);
			fs.writeFileSync(filePath, content);
		}
	}

	command.log('🏁 Completed generating Typescript Declaration files.');
}

/**
 * Gets the relative path to the TypeScript declaration directory.
 * Prioritizes the compilerOptions.declarationDir, falls back to packageJson paths,
 * and defaults to './dist/types' if neither is available.
 *
 * @param compilerOptions - The TypeScript compiler options.
 * @param packageJson - Optional package.json content.
 * @returns The relative path to the declaration directory.
 */
function getRelativeDeclarationDirPath(
	compilerOptions: TTsConfigCompilerOptions,
	packageJson?: PackageJson
): string {
	// Use declarationDir from compilerOptions if available
	if (typeof compilerOptions.declarationDir === 'string') {
		return path.relative(process.cwd(), compilerOptions.declarationDir);
	}

	// Fallback to resolving paths from packageJson
	if (packageJson) {
		const paths = resolvePathsFromPackageJson(packageJson, {
			format: 'types',
			preserveModules: true,
			resolvePath: false
		});

		if (paths.length > 0 && paths[0]?.output) {
			return paths[0].output;
		}
	}

	// Default path if no other options are available
	return './dist/types';
}

/**
 * Adjusts TypeScript compiler options to resolve paths based on a new declaration directory.
 *
 * @param compilerOptions - The original TypeScript compiler options.
 * @param relativeDeclarationDirPath - The relative path to the declaration directory.
 * @returns Adjusted TypeScript compiler options.
 */
function adjustCompilerOptionsForResolvedPaths(
	compilerOptions: TTsConfigCompilerOptions,
	relativeDeclarationDirPath: string
): TTsConfigCompilerOptions {
	const basePath = path.resolve(compilerOptions['pathsBasePath']?.toString() ?? process.cwd());
	const relativeRootDir = path.relative(basePath, compilerOptions.rootDir ?? './src');

	// Update paths to reflect the new relative declaration directory
	const updatedPaths =
		compilerOptions.paths != null
			? mapPathsToRelativeDeclarationDir(
					compilerOptions.paths,
					relativeRootDir,
					relativeDeclarationDirPath
				)
			: undefined;

	// Return new compiler options with updated paths and other necessary adjustments
	return {
		...compilerOptions,
		rootDir: relativeDeclarationDirPath,
		paths: updatedPaths,
		outDir: undefined,
		declarationDir: undefined
	};
}

/**
 * Maps original TypeScript paths to a new relative declaration directory.
 *
 * @param originalPaths - The original 'paths' from TypeScript compiler options.
 * @param relativeRootDir - The relative root directory path.
 * @param relativeDeclarationDir - The relative declaration directory path.
 * @returns Mapped paths object.
 */
function mapPathsToRelativeDeclarationDir(
	originalPaths: Record<string, string[]>,
	relativeRootDir: string,
	relativeDeclarationDir: string
): Record<string, string[]> {
	return Object.fromEntries(
		Object.entries(originalPaths).map(([key, value]) => [
			key,
			value.map((tsPath: string) =>
				tsPath.replace(
					new RegExp(`^\\.${path.sep}${relativeRootDir}`),
					`.${path.sep}${relativeDeclarationDir}`
				)
			)
		])
	);
}

function updateImportPaths(
	content: string,
	filePath: string,
	resolveTsPath: TResolveTsPaths
): string {
	// Regular expression to match import statements with named groups
	const importRegex =
		/(?:^|\n)import\s+(?<imported>[^\n]*)\s+from\s+(?<quote>'|")(?<path>[^'"]+)(?:\2);?/;

	return content.replace(importRegex, (match, imported, quote, importPath) => {
		if (
			typeof imported !== 'string' ||
			typeof quote !== 'string' ||
			typeof importPath !== 'string'
		) {
			return match;
		}
		const resolvedPath = resolveTsPath(importPath, filePath);
		if (resolvedPath) {
			return `import ${imported} from ${quote}${resolvedPath.replace('/index.d.ts', '')}${quote};`;
		}
		return match;
	});
}

function updateExportPaths(
	content: string,
	filePath: string,
	resolveTsPath: TResolveTsPaths
): string {
	// Regular expression to match export statements with named groups
	const exportRegex =
		/(?:^|\n)export\s+(?<exported>\*|\{[^}]*\})\s+from\s+(?<quote>'|")(?<path>[^'"]+)(?:\2);?/;

	return content.replace(exportRegex, (match, exported, quote, exportPath) => {
		if (
			typeof exported !== 'string' ||
			typeof quote !== 'string' ||
			typeof exportPath !== 'string'
		) {
			return match;
		}
		const resolvedPath = resolveTsPath(exportPath, filePath);
		if (resolvedPath) {
			return `export ${exported} from ${quote}${resolvedPath.replace('/index.d.ts', '')}${quote};`;
		}
		return match;
	});
}

function getFilePathsWithExtDeep(dir: string, ext: string): string[] {
	let result: string[] = [];
	const fileNames = fs.readdirSync(dir);

	for (const fileName of fileNames) {
		const fullPath = path.join(dir, fileName);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			result = result.concat(getFilePathsWithExtDeep(fullPath, ext));
		} else if (fileName.endsWith(ext)) {
			result.push(fullPath);
		}
	}

	return result;
}

export interface TGenerateDtsOptions {
	tsConfigPath?: string;
	packageJson?: PackageJson;
	shouldResolveTsPaths?: boolean;
}
