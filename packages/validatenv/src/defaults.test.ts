import { describe, expect, it } from 'vitest';
import { ciDefault, devDefault, envDefault, localDefault, testDefault } from './defaults';

describe('defaults', () => {
	describe('envDefault', () => {
		it('should return value when NODE_ENV matches any allowed env', () => {
			const defaultValue = 'test-value';
			const fn = envDefault(defaultValue, ['staging', 'development']);

			expect(fn({ NODE_ENV: 'staging' })).toBe(defaultValue);
			expect(fn({ NODE_ENV: 'development' })).toBe(defaultValue);
		});

		it('should return undefined when NODE_ENV does not match allowed envs', () => {
			const defaultValue = 'test-value';
			const fn = envDefault(defaultValue, ['staging', 'development']);

			expect(fn({ NODE_ENV: 'production' })).toBeUndefined();
			expect(fn({ NODE_ENV: 'test' })).toBeUndefined();
		});
	});

	describe('convenience functions', () => {
		const defaultValue = 'test-value';

		describe('devDefault', () => {
			const fn = devDefault(defaultValue);

			it('should return value when NODE_ENV is development', () => {
				expect(fn({ NODE_ENV: 'development' })).toBe(defaultValue);
			});

			it('should return undefined when NODE_ENV is not development', () => {
				expect(fn({ NODE_ENV: 'production' })).toBeUndefined();
				expect(fn({ NODE_ENV: 'test' })).toBeUndefined();
			});
		});

		describe('localDefault', () => {
			const fn = localDefault(defaultValue);

			it('should return value when NODE_ENV is local or development', () => {
				expect(fn({ NODE_ENV: 'local' })).toBe(defaultValue);
				expect(fn({ NODE_ENV: 'development' })).toBe(defaultValue);
			});

			it('should return undefined when NODE_ENV is not local or development', () => {
				expect(fn({ NODE_ENV: 'production' })).toBeUndefined();
				expect(fn({ NODE_ENV: 'test' })).toBeUndefined();
			});
		});

		describe('testDefault', () => {
			const fn = testDefault(defaultValue);

			it('should return value when NODE_ENV is test', () => {
				expect(fn({ NODE_ENV: 'test' })).toBe(defaultValue);
			});

			it('should return undefined when NODE_ENV is not test', () => {
				expect(fn({ NODE_ENV: 'production' })).toBeUndefined();
				expect(fn({ NODE_ENV: 'development' })).toBeUndefined();
			});
		});

		describe('ciDefault', () => {
			const fn = ciDefault(defaultValue);

			it('should return value when NODE_ENV is ci', () => {
				expect(fn({ NODE_ENV: 'ci' })).toBe(defaultValue);
			});

			it('should return undefined when NODE_ENV is not ci', () => {
				expect(fn({ NODE_ENV: 'production' })).toBeUndefined();
				expect(fn({ NODE_ENV: 'development' })).toBeUndefined();
			});
		});
	});
});
