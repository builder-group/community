import { createValidator } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import { booleanMiddleware, numberMiddleware } from './middlewares';
import { validateEnv, validateEnvValue } from './validate-env';
import { stringValidator } from './validators';

describe('validateEnv function', () => {
	it('should validate and transform environment variables', () => {
		const env = {
			PORT: '3000',
			DEBUG: 'true',
			API_URL: 'http://api.example.com'
		};

		const result = validateEnv(env, {
			PORT: {
				validator: createValidator<number>([]),
				middlewares: [numberMiddleware]
			},
			DEBUG: {
				validator: createValidator<boolean>([]),
				middlewares: [booleanMiddleware]
			},
			API_URL: {
				validator: createValidator<string>([])
			},
			plainValue: 'static-value'
		});

		expect(result).toEqual({
			PORT: 3000,
			DEBUG: true,
			API_URL: 'http://api.example.com',
			plainValue: 'static-value'
		});
	});

	it('should use default values when variables are undefined', () => {
		const env = {};

		const result = validateEnv(env, {
			PORT: {
				validator: createValidator<number>([]),
				defaultValue: 3000,
				middlewares: [numberMiddleware]
			},
			DEBUG: {
				validator: createValidator<boolean>([]),
				defaultValue: false
			}
		});

		expect(result).toEqual({
			PORT: 3000,
			DEBUG: false
		});
	});

	it('should support default value functions', () => {
		const env = { NODE_ENV: 'development' };

		const result = validateEnv(env, {
			PORT: {
				validator: createValidator<number>([]),
				defaultValue: (env) => (env['NODE_ENV'] === 'development' ? 3000 : 8080),
				middlewares: [numberMiddleware]
			}
		});

		expect(result).toEqual({
			PORT: 3000
		});
	});

	it('should throw error when validation fails', () => {
		const env = {
			PORT: 'not-a-number'
		};

		expect(() =>
			validateEnv(env, {
				PORT: {
					validator: createValidator<number>([
						{
							key: 'number',
							validate: (cx) => {
								if (typeof cx.value !== 'number') {
									cx.registerError({
										code: 'invalid_type',
										message: 'Must be a number'
									});
								}
							}
						}
					]),
					middlewares: [numberMiddleware],
					description: 'The port number for the server to listen on',
					example: '3000, 8080'
				}
			})
		).toThrow(
			'Environment validation failed:\n\nInvalid value for PORT\nDescription: The port number for the server to listen on\nExample: 3000, 8080\nError: Must be a number'
		);
	});

	it('should support custom environment variable keys', () => {
		const env = {
			DATABASE_URL: 'postgresql://localhost:5432/mydb',
			REDIS_CONNECTION: 'redis://localhost:6379'
		};

		const result = validateEnv(env, {
			dbUrl: {
				envKey: 'DATABASE_URL',
				validator: createValidator<string>([])
			},
			redisUrl: {
				envKey: 'REDIS_CONNECTION',
				validator: createValidator<string>([])
			}
		});

		expect(result).toEqual({
			dbUrl: 'postgresql://localhost:5432/mydb',
			redisUrl: 'redis://localhost:6379'
		});
	});
});

describe('validateEnvValue function', () => {
	it('should validate a single env value with required envKey', () => {
		const env = {
			API_KEY: 'secret-123'
		};

		const value = validateEnvValue(env, {
			envKey: 'API_KEY',
			validator: stringValidator,
			description: 'API key for authentication',
			example: 'secret-123'
		});

		expect(value).toBe('secret-123');
	});

	it('should throw error for invalid value', () => {
		const env = {
			API_KEY: 0 as any
		};

		expect(() =>
			validateEnvValue(env, {
				envKey: 'API_KEY',
				validator: stringValidator,
				description: 'API key for authentication',
				example: 'secret-123'
			})
		).toThrow('Environment validation failed: Invalid value for API_KEY');
	});

	it('should pass through plain values without validation', () => {
		const value = validateEnvValue(process.env, 'static-value');
		expect(value).toBe('static-value');
	});
});
