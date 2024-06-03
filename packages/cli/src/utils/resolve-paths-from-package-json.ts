import path from 'node:path';
import type { PackageJson } from 'type-fest';

import type { TInputOutputPath } from './resolve-paths';

/**
 * Resolves the output path based on the provided export conditions.
 * Selects appropriate property based on format and condition type.
 *
 * @param exportConditions - The export conditions from package.json.
 * @param config - Configuration object.
 * @returns The resolved output path.
 */
function resolveOutputPathFromPackageJson(
	exportConditions: PackageJson.ExportConditions,
	config: TResolvePathFromPackageJsonConfig
): string {
	const { format, preserveModules, useNestedExports, resolvePath } = config;

	const formatMap = useNestedExports
		? { esm: 'import', cjs: 'require', types: 'types' }
		: { esm: 'module', cjs: 'main', types: 'types' };

	// Try to resolve relative output path of specified format
	let relativeOutputPath = `./dist/${format}/index.js`;
	const propertyKey = formatMap[format];
	const propertyValue: unknown = exportConditions[propertyKey];
	if (typeof propertyValue === 'string') {
		relativeOutputPath = propertyValue;
	}

	// Remove '/index.js' if bundling to dir
	if (preserveModules) {
		relativeOutputPath = relativeOutputPath.replace(/\/[^/]*\.js$/, '');
	}

	return resolvePath ? path.resolve(process.cwd(), relativeOutputPath) : relativeOutputPath;
}

/**
 * Resolves the input path for the module based on 'source' export condition.
 *
 * @param exportConditions - The export conditions from package.json.
 * @returns The resolved input path.
 */
function resolveInputPathFromPackageJson(
	exportConditions: PackageJson.ExportConditions,
	config: TResolvePathFromPackageJsonConfig
): string {
	const { resolvePath } = config;

	// Try to resolve relative input path
	let relativeInputPath = './src/index.ts';
	const propertyValue: unknown = exportConditions.source;
	if (typeof propertyValue === 'string') {
		relativeInputPath = propertyValue;
	}

	return resolvePath ? path.resolve(process.cwd(), relativeInputPath) : relativeInputPath;
}

/**
 * Extracts and resolves input and output paths from package.json export conditions.
 * Supports both top-level and nested export conditions.
 *
 * @param packageJson - The package.json content.
 * @param config - Configuration object.
 * @returns An array of resolved paths.
 */
export function resolvePathsFromPackageJson(
	packageJson: PackageJson,
	config: TResolvePathsFromPackageJsonConfig
): TInputOutputPath[] {
	const { resolvePath = true } = config;
	const exportsArray = Array.isArray(packageJson.exports)
		? packageJson.exports
		: [packageJson.exports];
	const paths: TInputOutputPath[] = [];

	exportsArray.forEach((exportCondition) => {
		// If the export condition is an object (nested conditions or subpaths)
		if (isExportConditionObject(exportCondition)) {
			Object.entries(exportCondition).forEach(([exportKey, nestedExportCondition]) => {
				// Handles nested export conditions
				// Example: "package1": { ... }
				if (isExportConditionObject(nestedExportCondition)) {
					paths.push(
						createPathObject(nestedExportCondition, {
							...config,
							key: exportKey,
							useNestedExports: true,
							resolvePath
						})
					);
				}
			});
		}
	});

	// If no specific export conditions are found, the code defaults to extracting
	// the 'source', 'main', and 'module' fields from the top level of the package.json
	// Example: "source": "./src/index.ts", "main": "./dist/cjs/index.js", "module": "./dist/esm/index.js"
	if (paths.length === 0) {
		paths.push(
			createPathObject(packageJson as PackageJson.ExportConditions, {
				...config,
				useNestedExports: false,
				resolvePath
			})
		);
	}

	return paths;
}

/**
 * Creates a path object containing input, output, and other relevant information.
 *
 * @param exportConditions - Export conditions to resolve paths.
 * @param config - Configuration object.
 * @param key - Optional key for the path object.
 * @returns A path object with resolved input and output paths.
 */
function createPathObject(
	exportConditions: PackageJson.ExportConditions,
	config: TResolvePathFromPackageJsonConfig & { key?: string }
): TInputOutputPath {
	const { key, ...pathConfig } = config;
	return {
		input: resolveInputPathFromPackageJson(exportConditions, pathConfig),
		output: resolveOutputPathFromPackageJson(exportConditions, pathConfig),
		key
	};
}

/**
 * Checks if the provided export condition is an object.
 *
 * @param exportCondition - The export condition to check.
 * @returns True if the export condition is an object, false otherwise.
 */
function isExportConditionObject(
	exportCondition: unknown
): exportCondition is PackageJson.ExportConditions {
	return typeof exportCondition === 'object' && exportCondition !== null;
}

type TResolvePathFromPackageJsonConfig = {
	useNestedExports?: boolean;
} & Required<TResolvePathsFromPackageJsonConfig>;

interface TResolvePathsFromPackageJsonConfig {
	format: 'esm' | 'cjs' | 'types';
	preserveModules: boolean;
	resolvePath?: boolean;
}
