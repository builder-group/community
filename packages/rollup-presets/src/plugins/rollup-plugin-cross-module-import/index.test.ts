import type { PackageJson } from 'type-fest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCrossModuleImportPlugin } from './index';

describe('createCrossModuleImportPlugin', () => {
	const WORKING_DIR = '/working/dir';

	beforeEach(() => {
		vi.spyOn(process, 'cwd').mockReturnValue(WORKING_DIR);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('plugin configuration', () => {
		it('should handle empty exports', () => {
			const plugin = createCrossModuleImportPlugin({
				pkgJson: {},
				format: 'esm'
			}) as TCrossModuleImportPlugin;

			const result = plugin.resolveId('../some-module', '/src/file.ts');
			expect(result).toBeNull();
		});

		it('should skip non-module exports', () => {
			const plugin = createCrossModuleImportPlugin({
				pkgJson: {
					exports: {
						'.': { import: './dist/index.js' },
						'./package.json': './package.json',
						'something-else': './not-relative.js'
					}
				},
				format: 'esm'
			}) as TCrossModuleImportPlugin;

			const result = plugin.resolveId('../something-else', '/src/file.ts');
			expect(result).toBeNull();
		});
	});

	describe('import resolution', () => {
		const mockPackageJson: PackageJson = {
			name: 'test-package',
			exports: {
				'./adapter': {
					source: './src/adapter/index.ts',
					types: './dist/types/adapter/index.d.ts',
					import: './dist/adapter/esm/index.js',
					require: './dist/adapter/cjs/index.js'
				},
				'./valibot': {
					source: './src/valibot/index.ts',
					types: './dist/types/valibot/index.d.ts',
					import: './dist/valibot/esm/index.js',
					require: './dist/valibot/cjs/index.js'
				},
				'./custom-output': {
					source: './src/custom-output/index.ts',
					types: './types/custom-output/index.d.ts',
					import: './output/custom-output/esm/v2/index.js',
					require: './output/custom-output/cjs/v2/index.js'
				}
			}
		};

		const plugin = createCrossModuleImportPlugin({
			pkgJson: mockPackageJson,
			format: 'esm'
		}) as TCrossModuleImportPlugin;

		describe('module imports', () => {
			it('should resolve basic module import', () => {
				const result = plugin.resolveId('../adapter', `${WORKING_DIR}/src/valibot/index.ts`);

				expect(result).toEqual({
					id: '../../adapter/esm/index.js',
					external: true
				});
			});

			it('should resolve nested module import', () => {
				const result = plugin.resolveId(
					'../../../adapter',
					`${WORKING_DIR}/src/valibot/nested/deep/index.ts`
				);

				expect(result).toEqual({
					id: '../../../../adapter/esm/index.js',
					external: true
				});
			});

			it('should handle different output directory structure', () => {
				const result = plugin.resolveId(
					'../../../custom-output',
					`${WORKING_DIR}/src/valibot/nested/deep/index.ts`
				);

				expect(result).toEqual({
					id: '../../../../custom-output/esm/v2/index.js',
					external: true
				});
			});
		});

		describe('file imports', () => {
			it('should resolve specific file import', () => {
				const result = plugin.resolveId('../adapter/utils', `${WORKING_DIR}/src/valibot/index.ts`);

				expect(result).toEqual({
					id: '../../adapter/esm/utils.js',
					external: true
				});
			});

			it('should resolve nested file import', () => {
				const result = plugin.resolveId(
					'../../../adapter/test',
					`${WORKING_DIR}/src/valibot/nested/deep/index.ts`
				);

				expect(result).toEqual({
					id: '../../../../adapter/esm/test.js',
					external: true
				});
			});

			it('should handle different output directory with specific file', () => {
				const result = plugin.resolveId(
					'../../../custom-output/utils',
					`${WORKING_DIR}/src/valibot/nested/deep/index.ts`
				);

				expect(result).toEqual({
					id: '../../../../custom-output/esm/v2/utils.js',
					external: true
				});
			});
		});

		it('should handle virtual modules', () => {
			const result = plugin.resolveId('\0virtual-module', '/src/file.ts');
			expect(result).toBeNull();
		});

		it('should handle non-relative imports', () => {
			const result = plugin.resolveId('some-module', '/src/file.ts');
			expect(result).toBeNull();
		});

		it('should handle missing importer', () => {
			const result = plugin.resolveId('../adapter', undefined);
			expect(result).toBeNull();
		});

		it('should handle non-existent module', () => {
			const result = plugin.resolveId('../non-existent', '/src/file.ts');
			expect(result).toBeNull();
		});

		it('should handle CJS format', () => {
			const cjsPlugin = createCrossModuleImportPlugin({
				pkgJson: mockPackageJson,
				format: 'cjs'
			}) as TCrossModuleImportPlugin;

			const result = cjsPlugin.resolveId('../adapter', `${WORKING_DIR}/src/valibot/index.ts`);

			expect(result).toEqual({
				id: '../../adapter/cjs/index.js',
				external: true
			});
		});
	});
});

interface TCrossModuleImportPlugin {
	name: string;
	resolveId: (
		source: string,
		importer: string | undefined
	) => {
		id: string;
		external: boolean;
	} | null;
}
