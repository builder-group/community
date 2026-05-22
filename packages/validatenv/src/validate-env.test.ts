import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { emptyStringAsUndefined, pipePreprocess, stripTrailingSlash } from './preprocess';
import type { TEnv, TEnvSpec } from './types';
import { validateEnv, validateEnvVar } from './validate-env';
import { booleanValidator, numberValidator, stringValidator } from './validators';

describe('validate-env module', () => {
	describe('validateEnv function', () => {
		describe('types', () => {
			it('should infer output values from schemas, specs, and static entries', () => {
				const transformSchema = createStringToNumberSchema();
				const env = validateEnv(
					{
						PORT: '3000',
						DEBUG: 'true',
						API_URL: 'http://api.example.com',
						TRANSFORMED_PORT: '4000'
					},
					{
						PORT: numberValidator,
						DEBUG: booleanValidator,
						API_URL: { validator: stringValidator },
						TRANSFORMED_PORT: {
							validator: transformSchema,
							defaultValue: '4000'
						},
						PACKAGE_VERSION: '1.2.3',
						BUILD_META: {
							commitSha: 'abc123'
						}
					}
				);

				expectTypeOf(env).toEqualTypeOf<{
					PORT: number;
					DEBUG: boolean;
					API_URL: string;
					TRANSFORMED_PORT: number;
					PACKAGE_VERSION: string;
					BUILD_META: {
						commitSha: string;
					};
				}>();
			});

			it('should require defaults and preprocess output to match validator input', () => {
				const transformSchema = createStringToNumberSchema();

				expectTypeOf<{
					validator: typeof transformSchema;
					defaultValue: '3000';
				}>().toExtend<TEnvSpec<string, number>>();
				expectTypeOf<{
					validator: typeof transformSchema;
					defaultValue: 3000;
				}>().not.toExtend<TEnvSpec<string, number>>();
				expectTypeOf<{
					validator: typeof transformSchema;
					preprocess: () => '3000';
				}>().toExtend<TEnvSpec<string, number>>();
				expectTypeOf<{
					validator: typeof transformSchema;
					preprocess: () => 3000;
				}>().not.toExtend<TEnvSpec<string, number>>();

				const invalidDefault = () =>
					// @ts-expect-error defaultValue must match the validator input type.
					validateEnv({}, { PORT: { validator: transformSchema, defaultValue: 3000 } });
				const invalidPreprocess = () =>
					// @ts-expect-error preprocess must return the validator input type.
					validateEnv({}, { PORT: { validator: transformSchema, preprocess: () => 3000 } });

				void invalidDefault;
				void invalidPreprocess;
			});
		});

		describe('validation', () => {
			it('should validate direct schema specs', () => {
				const result = validateEnv(
					{
						PORT: '3000',
						DEBUG: 'true'
					},
					{
						PORT: createStringToNumberSchema(),
						DEBUG: booleanValidator
					}
				);

				expect(result).toEqual({
					PORT: 3000,
					DEBUG: true
				});
			});

			it('should validate object specs with custom env keys', () => {
				const result = validateEnv(
					{
						SERVICE_URL: 'https://api.example.com/'
					},
					{
						API_URL: {
							envKey: 'SERVICE_URL',
							validator: stringValidator,
							preprocess: stripTrailingSlash
						}
					}
				);

				expect(result).toEqual({
					API_URL: 'https://api.example.com'
				});
			});

			it('should throw all validation errors together', () => {
				expect(() =>
					validateEnv(
						{
							PORT: 'not-a-number',
							API_KEY: ''
						},
						{
							PORT: {
								validator: numberValidator,
								description: 'The port number for the server to listen on',
								example: '3000, 8080'
							},
							API_KEY: {
								validator: createStandardSchema<string>(() => ({
									issues: [{ message: 'Must not be empty' }]
								}))
							}
						}
					)
				).toThrow(
					'Environment validation failed:\n\nInvalid value for PORT\nDescription: The port number for the server to listen on\nExample: 3000, 8080\nError: Must be a valid number\n\nInvalid value for API_KEY\nError: Must not be empty'
				);
			});

			it('should pass through static spec entries', () => {
				const result = validateEnv(
					{},
					{
						PACKAGE_VERSION: '1.2.3',
						BUILD_META: {
							commitSha: 'abc123'
						}
					}
				);

				expect(result).toEqual({
					PACKAGE_VERSION: '1.2.3',
					BUILD_META: {
						commitSha: 'abc123'
					}
				});
			});

			it('should report object specs with invalid validators', () => {
				const invalidSpecs = {
					API_KEY: {
						validator: { validate: () => ({ value: 'secret' }) }
					}
				} as unknown as Record<string, never>;

				expect(() => validateEnv({}, invalidSpecs)).toThrow(
					'Environment validation failed:\n\nValidator for API_KEY must implement the Standard Schema interface.'
				);
			});

			it('should report preprocess errors', () => {
				expect(() =>
					validateEnv(
						{
							API_KEY: 'secret'
						},
						{
							API_KEY: {
								validator: stringValidator,
								preprocess: () => {
									throw new Error('Failed to clean value');
								}
							}
						}
					)
				).toThrow(
					'Environment validation failed:\n\nError preprocessing API_KEY: Failed to clean value'
				);
			});
		});

		describe('defaults', () => {
			it('should use default values when variables are undefined', () => {
				const result = validateEnv(
					{},
					{
						PORT: {
							validator: numberValidator,
							defaultValue: 3000
						}
					}
				);

				expect(result).toEqual({
					PORT: 3000
				});
			});

			it('should support default value functions', () => {
				const result = validateEnv<{ PORT: TEnvSpec<unknown, number> }>(
					{ NODE_ENV: 'development' },
					{
						PORT: {
							validator: numberValidator,
							defaultValue: (env: TEnv) => (env['NODE_ENV'] === 'development' ? 3000 : 8080)
						}
					}
				);

				expect(result).toEqual({
					PORT: 3000
				});
			});

			it('should validate default values through the schema', () => {
				const result = validateEnv(
					{},
					{
						PORT: {
							validator: createStringToNumberSchema(),
							defaultValue: '3000'
						}
					}
				);

				expect(result).toEqual({
					PORT: 3000
				});
			});

			it('should apply defaults after preprocessing', () => {
				const result = validateEnv<{ API_KEY: TEnvSpec<unknown, string> }>(
					{
						API_KEY: ''
					},
					{
						API_KEY: {
							validator: stringValidator,
							preprocess: pipePreprocess(emptyStringAsUndefined, stripTrailingSlash),
							defaultValue: 'fallback'
						}
					}
				);

				expect(result).toEqual({
					API_KEY: 'fallback'
				});
			});

			it('should report default value function errors', () => {
				expect(() =>
					validateEnv(
						{},
						{
							PORT: {
								validator: numberValidator,
								defaultValue: () => {
									throw new Error('Missing fallback');
								}
							}
						}
					)
				).toThrow(
					'Environment validation failed:\n\nError evaluating default value for PORT: Missing fallback'
				);
			});
		});
	});

	describe('validateEnvVar function', () => {
		describe('types', () => {
			it('should infer values from supported overloads', () => {
				const apiKey = validateEnvVar({ API_KEY: 'secret' }, 'API_KEY', stringValidator);
				const port = validateEnvVar(
					{
						PORT: '3000'
					},
					{
						envKey: 'PORT',
						validator: numberValidator
					}
				);

				expectTypeOf(apiKey).toEqualTypeOf<string>();
				expectTypeOf(port).toEqualTypeOf<number>();
			});
		});

		describe('validation', () => {
			it('should validate a single environment variable from a key and schema', () => {
				const value = validateEnvVar({ API_KEY: 'secret-123' }, 'API_KEY', stringValidator);

				expect(value).toBe('secret-123');
			});

			it('should validate a single environment variable from a key and spec', () => {
				const value = validateEnvVar(
					{
						PORT: '3000'
					},
					'PORT',
					{
						validator: numberValidator
					}
				);

				expect(value).toBe(3000);
			});

			it('should validate a single environment variable from an object spec', () => {
				const value = validateEnvVar(
					{
						API_KEY: 'secret-123'
					},
					{
						envKey: 'API_KEY',
						validator: stringValidator,
						description: 'API key for authentication',
						example: 'secret-123'
					}
				);

				expect(value).toBe('secret-123');
			});

			it('should throw validation errors for invalid values', () => {
				expect(() =>
					validateEnvVar(
						{
							API_KEY: 0
						},
						{
							envKey: 'API_KEY',
							validator: stringValidator,
							description: 'API key for authentication',
							example: 'secret-123'
						}
					)
				).toThrow('Environment validation failed: Invalid value for API_KEY');
			});
		});
	});
});

function createStringToNumberSchema(): StandardSchemaV1<string, number> {
	return createStandardSchema<string, number>((value) => {
		if (typeof value !== 'string') {
			return {
				issues: [{ message: 'Must be a string' }]
			};
		}

		return { value: Number(value) };
	});
}

function createStandardSchema<GInput, GOutput = GInput>(
	validate: (
		value: unknown
	) => StandardSchemaV1.Result<GOutput> | Promise<StandardSchemaV1.Result<GOutput>>
): StandardSchemaV1<GInput, GOutput> {
	return {
		'~standard': {
			version: 1,
			vendor: 'test',
			validate
		}
	};
}
