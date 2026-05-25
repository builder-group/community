import { describe, expect, it } from 'vitest';
import { isFormData, isNativeBody, isUrlSearchParams } from './native-body';

describe('native-body module', () => {
	describe('isNativeBody function', () => {
		it('should return true for native fetch body values', () => {
			expect(isNativeBody('plain text')).toBe(true);
			expect(isNativeBody(new Blob(['content']))).toBe(true);
			expect(isNativeBody(new FormData())).toBe(true);
			expect(isNativeBody(new ArrayBuffer(1))).toBe(true);
			expect(isNativeBody(new Uint8Array([1]))).toBe(true);
			expect(isNativeBody(new ReadableStream())).toBe(true);
			expect(isNativeBody(new URLSearchParams({ search: 'weather' }))).toBe(true);
		});

		it('should return false for plain objects and nullish values', () => {
			expect(isNativeBody({ key: 'value' })).toBe(false);
			expect(isNativeBody(null)).toBe(false);
			expect(isNativeBody(undefined)).toBe(false);
		});
	});

	describe('isFormData function', () => {
		it('should return true for FormData values', () => {
			expect(isFormData(new FormData())).toBe(true);
		});

		it('should return false for non-FormData values', () => {
			expect(isFormData({ key: 'value' })).toBe(false);
		});
	});

	describe('isUrlSearchParams function', () => {
		it('should return true for URLSearchParams values', () => {
			expect(isUrlSearchParams(new URLSearchParams({ search: 'weather' }))).toBe(true);
		});

		it('should return false for non-URLSearchParams values', () => {
			expect(isUrlSearchParams({ search: 'weather' })).toBe(false);
		});
	});
});
