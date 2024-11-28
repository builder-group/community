import { describe, expect, it } from 'vitest';
import { Err, mapErr, mapOk, Ok, unwrapErr, unwrapOk, type TResult } from './result';

describe('Result implementation', () => {
	it('should create an Ok result correctly', () => {
		const result = Ok(42);
		expect(result._type).toBe('Ok');
		expect(result.value).toBe(42);
		expect(result.unwrap()).toBe(42);
		expect(result.isOk()).toBe(true);
		expect(result.isErr()).toBe(false);
	});

	it('should create an Err result correctly', () => {
		const result = Err('Some error');
		expect(result._type).toBe('Err');
		expect(result.error).toBe('Some error');
		expect(() => result.unwrap()).toThrowError();
		expect(result.isOk()).toBe(false);
		expect(result.isErr()).toBe(true);
	});

	it('should handle unwrap correctly for Ok result', () => {
		const result = Ok('Success');
		expect(result.unwrap()).toBe('Success');
	});

	it('should throw error on unwrap for Err result', () => {
		const result = Err('Error occurred');
		expect(() => result.unwrap()).toThrow('Error occurred');
	});

	it('should distinguish between Ok and Err using type guards', () => {
		const okResult: TResult<number, string> = Ok(99);
		const errResult: TResult<number, string> = Err('Failure');

		if (okResult.isOk()) {
			expect(okResult.value).toBe(99);
		} else {
			throw new Error('Expected okResult to be Ok');
		}

		if (errResult.isErr()) {
			expect(errResult.error).toBe('Failure');
		} else {
			throw new Error('Expected errResult to be Err');
		}
	});

	it('should handle multiple Ok and Err instances', () => {
		const okResult1 = Ok(1);
		const okResult2 = Ok(2);
		const errResult1 = Err('First error');
		const errResult2 = Err('Second error');

		expect(okResult1.isOk()).toBe(true);
		expect(okResult2.isOk()).toBe(true);
		expect(errResult1.isErr()).toBe(true);
		expect(errResult2.isErr()).toBe(true);
	});

	it('should handle unwrapOk correctly for Ok result', () => {
		const result = Ok('Success');
		expect(unwrapOk(result)).toBe('Success');
	});

	it('should throw error on unwrapErr for Ok result', () => {
		const result = Ok('No error');
		expect(() => unwrapErr(result)).toThrow('Expected an Err result');
	});

	it('should handle unwrapErr correctly for Err result', () => {
		const result = Err('Error occurred');
		expect(unwrapErr(result)).toBe('Error occurred');
	});

	it('should throw error on unwrapOk for Err result', () => {
		const result = Err('Error occurred');
		expect(() => unwrapOk(result)).toThrow('Expected an Ok result');
	});

	it('should correctly map an Ok result using mapOk', () => {
		const result = Ok(5);
		const mappedResult = mapOk(result, (value) => value * 2);
		expect(mappedResult.isOk()).toBe(true);
		expect(mappedResult.unwrap()).toBe(10);
	});

	it('should leave an Err result unchanged using mapOk', () => {
		const result = Err<string, string>('Some error');
		const mappedResult = mapOk(result, (value) => value.toUpperCase());
		expect(mappedResult.isErr()).toBe(true);
		expect(unwrapErr(mappedResult)).toBe('Some error');
	});

	it('should correctly map an Err result using mapErr', () => {
		const result = Err<number, string>('Some error');
		const mappedResult = mapErr(result, (error) => `Mapped: ${error}`);
		expect(mappedResult.isErr()).toBe(true);
		expect(unwrapErr(mappedResult)).toBe('Mapped: Some error');
	});

	it('should leave an Ok result unchanged using mapErr', () => {
		const result = Ok<number, string>(42);
		const mappedResult = mapErr(result, (error) => `Mapped: ${error}`);
		expect(mappedResult.isOk()).toBe(true);
		expect(mappedResult.unwrap()).toBe(42);
	});
});
