import { describe, expect, it } from 'vitest';
import {
	ciDefault,
	combineDefaults,
	devDefault,
	envDefault,
	localDefault,
	testDefault
} from './defaults';

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

	describe('combineDefaults', () => {
		const defaultValue = 'test-value';
		const ciValue = 'ci-value';

		it('should try defaults in order and return first matching value', () => {
			const combined = combineDefaults(ciDefault(ciValue), devDefault(defaultValue));

			// When CI is set, should return CI value regardless of NODE_ENV
			expect(combined({ CI: 'true', NODE_ENV: 'development' })).toBe(ciValue);

			// When CI is not set but NODE_ENV is development, return dev value
			expect(combined({ NODE_ENV: 'development' })).toBe(defaultValue);

			// When neither condition is met, return undefined
			expect(combined({ NODE_ENV: 'production' })).toBeUndefined();
		});

		it('should work with multiple defaults in priority order', () => {
			const combined = combineDefaults(
				ciDefault('ci-value'),
				testDefault('test-value'),
				devDefault('dev-value')
			);

			expect(combined({ CI: 'true' })).toBe('ci-value');
			expect(combined({ NODE_ENV: 'test' })).toBe('test-value');
			expect(combined({ NODE_ENV: 'development' })).toBe('dev-value');
			expect(combined({ NODE_ENV: 'production' })).toBeUndefined();
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

			it('should return value when CI env is set', () => {
				expect(fn({ CI: 'true' })).toBe(defaultValue);
				expect(fn({ CI: '1' })).toBe(defaultValue);
			});

			it('should return undefined when CI env is not set', () => {
				expect(fn({})).toBeUndefined();
				expect(fn({ CI: '' })).toBeUndefined();
				expect(fn({ CI: undefined })).toBeUndefined();
			});
		});
	});
});
