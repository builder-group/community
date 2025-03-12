import type { PackageJson } from 'type-fest';

/**
 * Creates a function to determine which modules should be treated as external in rollup.
 *
 * Dependencies and peer dependencies are marked as external by default because:
 * - Prevents duplication in node_modules
 * - Enables package managers to handle versioning and security updates
 * - Dependencies are automatically installed, so no need to bundle
 *
 * @example
 * ```ts
 * const isExternal = createRollupExternalConfig(packageJson, {
 *   fileTypesAsExternal: ['.css', '.svg']
 * });
 *
 * export default {
 *   external: isExternal,
 *   // ... other rollup config
 * };
 * ```
 */
export function createRollupExternalConfig(
	pkgJson: PackageJson,
	options: TRollupExternalConfig = {}
): (source: string) => boolean {
	const { fileTypesAsExternal = [], pkgJsonDepsAsExternal = true } = options;

	// Get all dependency names from package.json
	const allDepKeys = pkgJsonDepsAsExternal
		? new Set([
				...Object.keys(pkgJson.dependencies ?? {}),
				...Object.keys(pkgJson.peerDependencies ?? {})
			])
		: new Set();

	// Normalize file extensions to lowercase for case-insensitive comparison
	const normalizedFileTypes = fileTypesAsExternal.map((ext) =>
		ext.toLowerCase().startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
	);

	return (source: string): boolean => {
		// Check if it's a package.json dependency
		if (pkgJsonDepsAsExternal && allDepKeys.has(source)) {
			return true;
		}

		// Check if it matches any of the specified file types
		if (normalizedFileTypes.length > 0) {
			const sourceLower = source.toLowerCase();
			return normalizedFileTypes.some((ext) => sourceLower.endsWith(ext));
		}

		return false;
	};
}

export interface TRollupExternalConfig {
	/**
	 * Whether to treat package.json dependencies and peerDependencies as external.
	 * @default true
	 */
	pkgJsonDepsAsExternal?: boolean;

	/**
	 * File extensions to treat as external (e.g. ['.css', '.svg']).
	 * Extensions are case-insensitive.
	 * @default []
	 */
	fileTypesAsExternal?: string[];
}
