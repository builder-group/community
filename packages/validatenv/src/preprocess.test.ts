import { describe, expect, expectTypeOf, it } from 'vitest';
import { emptyStringAsUndefined, pipePreprocess, stripTrailingSlash } from './preprocess';
import type { TEnvPreprocess } from './types';

describe('preprocess module', () => {
	describe('emptyStringAsUndefined function', () => {
		it('should return undefined for blank strings', () => {
			expect(emptyStringAsUndefined('')).toBeUndefined();
			expect(emptyStringAsUndefined('   ')).toBeUndefined();
		});

		it('should return undefined for nullish values', () => {
			expect(emptyStringAsUndefined(undefined)).toBeUndefined();
			expect(emptyStringAsUndefined(null)).toBeUndefined();
		});

		it('should reject non-string values', () => {
			expect(() => emptyStringAsUndefined(123)).toThrow('Expected a string value.');
		});

		it('should preserve non-empty strings', () => {
			expect(emptyStringAsUndefined('hello')).toBe('hello');
			expect(emptyStringAsUndefined('  hello  ')).toBe('  hello  ');
		});
	});

	describe('stripTrailingSlash function', () => {
		it('should remove one trailing slash', () => {
			expect(stripTrailingSlash('https://api.example.com/')).toBe('https://api.example.com');
		});

		it('should preserve strings without a trailing slash', () => {
			expect(stripTrailingSlash('https://api.example.com')).toBe('https://api.example.com');
		});

		it('should return undefined for nullish values', () => {
			expect(stripTrailingSlash(undefined)).toBeUndefined();
			expect(stripTrailingSlash(null)).toBeUndefined();
		});

		it('should reject non-string values', () => {
			expect(() => stripTrailingSlash(123)).toThrow('Expected a string value.');
		});
	});

	describe('pipePreprocess function', () => {
		it('should infer the shared preprocess output type', () => {
			const preprocess = pipePreprocess(emptyStringAsUndefined, stripTrailingSlash);

			expectTypeOf(preprocess).toEqualTypeOf<TEnvPreprocess<string>>();
		});

		it('should run preprocess functions in order', () => {
			const preprocess = pipePreprocess(emptyStringAsUndefined, stripTrailingSlash);

			expect(preprocess('https://api.example.com/')).toBe('https://api.example.com');
		});

		it('should stop when a preprocess returns undefined', () => {
			const preprocess = pipePreprocess(emptyStringAsUndefined, () => 'should-not-run');

			expect(preprocess('')).toBeUndefined();
		});
	});
});
