import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { booleanValidator, numberValidator, urlValidator } from './validators';
import { createViteEnvDefine } from './vite-env-define';

describe('createViteEnvDefine function', () => {
	describe('types', () => {
		it('should infer Vite define keys from the returned env keys', () => {
			const define = createViteEnvDefine(
				{
					PORT: '3000',
					API_CORE_URL: 'https://api.example.com'
				},
				{
					PORT: numberValidator,
					VITE_API_CORE_URL: {
						envKey: 'API_CORE_URL',
						validator: urlValidator
					}
				}
			);

			expectTypeOf(define).toEqualTypeOf<{
				'import.meta.env.PORT': string;
				'import.meta.env.VITE_API_CORE_URL': string;
			}>();
		});
	});

	describe('validation', () => {
		it('should validate and stringify values for Vite define', () => {
			const define = createViteEnvDefine(
				{
					PORT: '3000',
					DEBUG: 'true',
					API_CORE_URL: 'https://api.example.com'
				},
				{
					PORT: numberValidator,
					DEBUG: booleanValidator,
					VITE_API_CORE_URL: {
						envKey: 'API_CORE_URL',
						validator: urlValidator
					}
				}
			);

			expect(define).toEqual({
				'import.meta.env.PORT': '3000',
				'import.meta.env.DEBUG': 'true',
				'import.meta.env.VITE_API_CORE_URL': '"https://api.example.com"'
			});
		});

		it('should stringify undefined values as JavaScript undefined', () => {
			const define = createViteEnvDefine(
				{},
				{
					OPTIONAL_VALUE: createStandardSchema<unknown, string | undefined>(() => ({
						value: undefined
					}))
				}
			);

			expect(define).toEqual({
				'import.meta.env.OPTIONAL_VALUE': 'undefined'
			});
		});

		it('should throw validation errors from the env spec', () => {
			expect(() =>
				createViteEnvDefine(
					{
						PORT: 'invalid'
					},
					{
						PORT: numberValidator
					}
				)
			).toThrow('Environment validation failed');
		});

		it('should reject values that cannot be serialized for Vite define', () => {
			expect(() =>
				createViteEnvDefine(
					{},
					{
						VALUE: createStandardSchema<unknown, symbol>(() => ({
							value: Symbol('test')
						}))
					}
				)
			).toThrow('Cannot serialize VALUE for Vite define.');
		});
	});
});

function createStandardSchema<GInput, GOutput = GInput>(
	validate: (value: unknown) => StandardSchemaV1.Result<GOutput>
): StandardSchemaV1<GInput, GOutput> {
	return {
		'~standard': {
			version: 1,
			vendor: 'test',
			validate
		}
	};
}
