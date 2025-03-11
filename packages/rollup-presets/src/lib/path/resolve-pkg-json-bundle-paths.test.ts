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
					format: 'cjs',
					extension: '.cjs'
				}
			]);
		});

		it('should resolve Types format', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, format: 'types' });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.d.ts',
					format: 'types',
					extension: '.ts'
				}
			]);
		});

		it('should handle preserveModules', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, preserveModules: true });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist',
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
					key: '.',
					format: 'esm',
					extension: '.mjs'
				},
				{
					input: './src/utils.ts',
					output: './dist/utils.mjs',
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
					key: '.',
					format: 'cjs',
					extension: '.cjs'
				},
				{
					input: './src/utils.ts',
					output: './dist/utils.cjs',
					key: './utils',
					format: 'cjs',
					extension: '.cjs'
				}
			]);
		});

		it('should resolve Types format with keys', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, format: 'types' });
			expect(paths).toEqual([
				{
					input: './src/index.ts',
					output: './dist/index.d.ts',
					key: '.',
					format: 'types',
					extension: '.ts'
				},
				{
					input: './src/utils.ts',
					output: './dist/utils.d.ts',
					key: './utils',
					format: 'types',
					extension: '.ts'
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
					key: '.',
					format: 'cjs',
					extension: '.cjs'
				}
			]);
		});

		it('should resolve Types format with types and key', () => {
			const paths = resolvePkgJsonBundlePaths(pkgJson, { ...defaultConfig, format: 'types' });
			expect(paths).toEqual([
				{
					extension: '.ts',
					format: 'types',
					input: './src/index.ts',
					key: '.',
					output: './dist/types/index.d.mts'
				},
				{
					extension: '.ts',
					format: 'types',
					input: './src/index.ts',
					key: '.',
					output: './dist/types/index.d.cts'
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
					key: '.',
					format: 'esm',
					extension: '.mjs'
				},
				{
					input: './src/b.ts',
					output: './dist/b.mjs',
					key: '.',
					format: 'esm',
					extension: '.mjs'
				}
			]);
		});
	});
});
