import { describe, expect, it } from 'vitest';
import {
	ciDefault,
	devDefault,
	envDefault,
	localDefault,
	pipeDefaults,
	testDefault
} from './defaults';

describe('defaults module', () => {
	describe('envDefault function', () => {
		it('should return value when NODE_ENV is allowed', () => {
			const getDefault = envDefault('staging-value', ['staging', 'development']);

			expect(getDefault({ NODE_ENV: 'staging' })).toBe('staging-value');
		});

		it('should return undefined when NODE_ENV is not allowed', () => {
			const getDefault = envDefault('staging-value', ['staging', 'development']);

			expect(getDefault({ NODE_ENV: 'production' })).toBeUndefined();
		});
	});

	describe('pipeDefaults function', () => {
		it('should return the first matching default value', () => {
			const getDefault = pipeDefaults(ciDefault('ci-value'), devDefault('dev-value'));

			expect(getDefault({ CI: 'true', NODE_ENV: 'development' })).toBe('ci-value');
		});

		it('should return undefined when no defaults match', () => {
			const getDefault = pipeDefaults(testDefault('test-value'), devDefault('dev-value'));

			expect(getDefault({ NODE_ENV: 'production' })).toBeUndefined();
		});
	});

	describe('convenience defaults', () => {
		it('should resolve NODE_ENV defaults for their intended environments', () => {
			expect(devDefault('dev-value')({ NODE_ENV: 'development' })).toBe('dev-value');
			expect(localDefault('local-value')({ NODE_ENV: 'local' })).toBe('local-value');
			expect(testDefault('test-value')({ NODE_ENV: 'test' })).toBe('test-value');
		});

		it('should resolve ciDefault from a truthy CI env value', () => {
			const getDefault = ciDefault('ci-value');

			expect(getDefault({ CI: 'true' })).toBe('ci-value');
			expect(getDefault({ CI: '' })).toBeUndefined();
		});
	});
});
