import { describe, expect, it } from 'vitest';
import { devDefault, localDefault, testDefault } from './defaults';

describe('default value functions', () => {
	describe('devDefault', () => {
		it('should return value when NODE_ENV is not production', () => {
			const env = { NODE_ENV: 'development' };
			const value = 'dev-value';
			const result = devDefault(value)(env);
			expect(result).toBe(value);
		});

		it('should return undefined when NODE_ENV is production', () => {
			const env = { NODE_ENV: 'production' };
			const value = 'dev-value';
			const result = devDefault(value)(env);
			expect(result).toBeUndefined();
		});
	});

	describe('localDefault', () => {
		it('should return value when NODE_ENV is local', () => {
			const env = { NODE_ENV: 'local' };
			const value = 'local-value';
			const result = localDefault(value)(env);
			expect(result).toBe(value);
		});

		it('should return value when NODE_ENV is development', () => {
			const env = { NODE_ENV: 'development' };
			const value = 'local-value';
			const result = localDefault(value)(env);
			expect(result).toBe(value);
		});

		it('should return undefined for other environments', () => {
			const env = { NODE_ENV: 'production' };
			const value = 'local-value';
			const result = localDefault(value)(env);
			expect(result).toBeUndefined();
		});
	});

	describe('testDefault', () => {
		it('should return value when NODE_ENV is test', () => {
			const env = { NODE_ENV: 'test' };
			const value = 'test-value';
			const result = testDefault(value)(env);
			expect(result).toBe(value);
		});

		it('should return undefined for other environments', () => {
			const env = { NODE_ENV: 'development' };
			const value = 'test-value';
			const result = testDefault(value)(env);
			expect(result).toBeUndefined();
		});
	});
});
