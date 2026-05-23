import { describe, expect, expectTypeOf, it } from 'vitest';
import { createEnv } from './create-env';
import { stringValidator, urlValidator } from './validators';

describe('createEnv function', () => {
	describe('types', () => {
		it('should infer the full env object from server, client, and shared specs', () => {
			const env = createEnv({
				env: {
					DATABASE_URL: 'https://db.example.com',
					VITE_API_URL: 'https://api.example.com',
					NODE_ENV: 'test'
				},
				isServer: true,
				server: {
					DATABASE_URL: urlValidator
				},
				client: {
					VITE_API_URL: urlValidator
				},
				shared: {
					NODE_ENV: stringValidator,
					APP_VERSION: '1.2.3'
				}
			});

			expectTypeOf(env).toEqualTypeOf<
				Readonly<{
					DATABASE_URL: string;
					VITE_API_URL: string;
					NODE_ENV: string;
					APP_VERSION: string;
				}>
			>();
		});

		it('should infer the env object when optional spec groups are omitted', () => {
			const env = createEnv({
				env: {
					VITE_API_URL: 'https://api.example.com'
				},
				client: {
					VITE_API_URL: urlValidator
				}
			});

			expectTypeOf(env).toEqualTypeOf<
				Readonly<{
					VITE_API_URL: string;
				}>
			>();
		});
	});

	describe('validation', () => {
		it('should validate server, client, and shared specs in server mode', () => {
			const env = createEnv({
				env: {
					DATABASE_URL: 'https://db.example.com',
					VITE_API_URL: 'https://api.example.com',
					NODE_ENV: 'test'
				},
				isServer: true,
				server: {
					DATABASE_URL: urlValidator
				},
				client: {
					VITE_API_URL: urlValidator
				},
				shared: {
					NODE_ENV: stringValidator
				}
			});

			expect(env).toEqual({
				DATABASE_URL: 'https://db.example.com',
				VITE_API_URL: 'https://api.example.com',
				NODE_ENV: 'test'
			});
		});

		it('should skip server spec validation in client mode', () => {
			const env = createEnv({
				env: {
					DATABASE_URL: 'not-a-url',
					VITE_API_URL: 'https://api.example.com',
					NODE_ENV: 'test'
				},
				isServer: false,
				server: {
					DATABASE_URL: urlValidator
				},
				client: {
					VITE_API_URL: urlValidator
				},
				shared: {
					NODE_ENV: stringValidator
				}
			});

			expect(env).toEqual({
				VITE_API_URL: 'https://api.example.com',
				NODE_ENV: 'test'
			});
		});
	});

	describe('client access guard', () => {
		it('should block server keys in client mode', () => {
			const env = createEnv({
				env: {
					VITE_API_URL: 'https://api.example.com'
				},
				isServer: false,
				server: {
					dbUrl: {
						envKey: 'DATABASE_URL',
						validator: urlValidator
					}
				},
				client: {
					VITE_API_URL: urlValidator
				}
			});

			expect(() => env.dbUrl).toThrow(
				'Attempted to access server-only env key dbUrl on the client.'
			);
		});

		it('should pass the blocked key to a custom invalid access handler', () => {
			const env = createEnv({
				env: {},
				isServer: false,
				server: {
					DATABASE_URL: urlValidator
				},
				onInvalidAccess(key) {
					throw new Error(`Blocked ${key}`);
				}
			});

			expect(() => env.DATABASE_URL).toThrow('Blocked DATABASE_URL');
		});

		it('should ignore module interop probe keys in client mode', () => {
			const env = createEnv({
				env: {},
				isServer: false,
				server: {
					DATABASE_URL: urlValidator
				}
			});

			expect(Reflect.get(env, '__esModule')).toBeUndefined();
			expect(Reflect.get(env, '$$typeof')).toBeUndefined();
		});
	});

	describe('spec groups', () => {
		it('should reject duplicate output keys across spec groups', () => {
			expect(() =>
				createEnv({
					env: {},
					isServer: true,
					server: {
						API_URL: urlValidator
					},
					client: {
						API_URL: urlValidator
					}
				})
			).toThrow('Env spec key API_URL is declared in both server and client specs.');
		});
	});
});
