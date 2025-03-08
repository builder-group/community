import type { PackageJson } from 'type-fest';
import { describe, expect, it } from 'vitest';
import {
	resolvePkgJsonBundlePaths,
	TResolvePkgJsonBundlePathConfig
} from './resolve-pkg-json-bundle-paths';

describe('resolvePkgJsonBundlePaths', () => {
	const defaultConfig: TResolvePkgJsonBundlePathConfig = {
		format: 'esm',
		preserveModules: false,
		resolvePath: false
	};

	it('should resolve standard package.json fields', () => {
		const packageJson: PackageJson = {
			main: './dist/cjs/index.js',
			module: './dist/esm/index.js',
			types: './dist/types/index.d.ts',
			source: './src/custom/index.ts'
		};

		const paths = resolvePkgJsonBundlePaths(packageJson, defaultConfig);
		expect(paths).toEqual([{ input: './src/custom/index.ts', output: './dist/esm/index.js' }]);

		// Test preserveModules
		const preservedPaths = resolvePkgJsonBundlePaths(packageJson, {
			...defaultConfig,
			preserveModules: true
		});
		expect(preservedPaths).toEqual([{ input: './src/custom/index.ts', output: './dist/esm' }]);
	});

	it('should use default paths when fields are missing', () => {
		const paths = resolvePkgJsonBundlePaths({}, defaultConfig);
		expect(paths).toEqual([{ input: './src/index.ts', output: './dist/esm/index.js' }]);
	});

	it('should handle conditional exports', () => {
		const packageJson: PackageJson = {
			exports: {
				'.': {
					source: './src/index.ts',
					import: './dist/esm/index.js',
					require: './dist/cjs/index.js'
				},
				'./utils': {
					source: './src/utils/index.ts',
					import: './dist/esm/utils.js',
					require: './dist/cjs/utils.js'
				}
			}
		};

		const paths = resolvePkgJsonBundlePaths(packageJson, defaultConfig);
		expect(paths).toEqual([
			{ input: './src/index.ts', output: './dist/esm/index.js' },
			{ input: './src/utils/index.ts', output: './dist/esm/utils.js' }
		]);
	});

	it('should handle array exports', () => {
		const packageJson: PackageJson = {
			exports: [
				{
					source: './src/a.ts',
					import: './dist/esm/a.js'
				},
				{
					source: './src/b.ts',
					import: './dist/esm/b.js'
				}
			]
		};

		const paths = resolvePkgJsonBundlePaths(packageJson, defaultConfig);
		expect(paths).toEqual([
			{ input: './src/a.ts', output: './dist/esm/a.js' },
			{ input: './src/b.ts', output: './dist/esm/b.js' }
		]);
	});
});
