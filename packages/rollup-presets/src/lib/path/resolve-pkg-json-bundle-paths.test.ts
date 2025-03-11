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

	describe('top-level fields', () => {
		const pkgJson: PackageJson = {
			main: './dist/index.cjs',
			module: './dist/index.mjs',
			types: './dist/index.d.ts',
			source: './src/index.ts'
		};

		it('should resolve ESM format', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, defaultConfig);
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.mjs',
					types: './dist/index.d.ts',
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});

		it('should resolve CJS format', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, format: 'cjs' });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.cjs',
					types: './dist/index.d.ts',
					format: 'cjs',
					extension: '.cjs'
				}
			]);
		});

		it('should handle preserveModules', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, preserveModules: true });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist',
					types: './dist/index.d.ts',
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});
	});

	describe('exports with conditions', () => {
		const pkgJson: PackageJson = {
			exports: {
				'.': {
					source: './src/index.ts',
					import: './dist/index.mjs',
					require: './dist/index.cjs',
					types: './dist/index.d.ts'
				},
				'./utils': {
					source: './src/utils.ts',
					import: './dist/utils.mjs',
					require: './dist/utils.cjs',
					types: './dist/utils.d.ts'
				}
			}
		};

		it('should resolve ESM format with keys', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, defaultConfig);
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.mjs',
					types: './dist/index.d.ts',
					key: '.',
					format: 'esm',
					extension: '.mjs'
				},
				{
					input: './src/utils.ts',
					output: './dist/utils.mjs',
					types: './dist/utils.d.ts',
					key: './utils',
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});

		it('should resolve CJS format with keys', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, format: 'cjs' });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.cjs',
					types: './dist/index.d.ts',
					key: '.',
					format: 'cjs',
					extension: '.cjs'
				},
				{
					input: './src/utils.ts',
					output: './dist/utils.cjs',
					types: './dist/utils.d.ts',
					key: './utils',
					format: 'cjs',
					extension: '.cjs'
				}
			]);
		});
	});

	describe('nested exports with subpaths', () => {
		const pkgJson: PackageJson = {
			exports: {
				'.': {
					import: {
						types: './dist/types/index.d.mts',
						default: './dist/index.mjs',
						source: './src/index.ts'
					},
					require: {
						types: './dist/types/index.d.cts',
						default: './dist/index.cjs',
						source: './src/index.ts'
					}
				}
			}
		};

		it('should resolve ESM format with types and key', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, defaultConfig);
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.mjs',
					types: './dist/types/index.d.mts',
					key: '.',
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});

		it('should resolve CJS format with types and key', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, format: 'cjs' });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.cjs',
					types: './dist/types/index.d.cts',
					key: '.',
					format: 'cjs',
					extension: '.cjs'
				}
			]);
		});
	});

	describe('array exports', () => {
		const pkgJson: PackageJson = {
			exports: [
				{
					source: './src/a.ts',
					import: './dist/a.mjs',
					require: './dist/a.cjs',
					types: './dist/a.d.ts'
				},
				{
					source: './src/b.ts',
					import: './dist/b.mjs',
					require: './dist/b.cjs',
					types: './dist/b.d.ts'
				}
			]
		};

		it('should handle array exports with default key', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, defaultConfig);
			expect(paths).toEqual([
				{
					input: './src/a.ts',
					output: './dist/a.mjs',
					types: './dist/a.d.ts',
					key: '.',
					format: 'esm',
					extension: '.mjs'
				},
				{
					input: './src/b.ts',
					output: './dist/b.mjs',
					types: './dist/b.d.ts',
					key: '.',
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});
	});

	describe('fallbacks and edge cases', () => {
		it('should use default source path if not specified', () => {
			const paths = resolvePkgJsonBundlePaths(
				{
					module: './dist/index.mjs'
				},
				defaultConfig
			);
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.mjs',
					types: undefined,
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});

		it('should handle missing types', () => {
			const paths = resolvePkgJsonBundlePaths(
				{
					module: './dist/index.mjs',
					source: './src/index.ts'
				},
				defaultConfig
			);
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.mjs',
					types: undefined,
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});
	});
});
