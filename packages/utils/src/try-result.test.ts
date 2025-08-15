import { describe, expect, it } from 'vitest';
import {
	deserialize,
	Err,
	isErr,
	isOk,
	Ok,
	serialize,
	t,
	tAsync,
	unwrapErr,
	unwrapOk,
	unwrapOr,
	unwrapOrNull,
	type TResult
} from './try-result';

describe('TryResult implementation', () => {
	describe('OkResult class', () => {
		it('should create an Ok result correctly', () => {
			const result = Ok(42);
			expect(result.value).toBe(42);
			expect(result.unwrap()).toBe(42);
			expect(result.isOk()).toBe(true);
			expect(result.isErr()).toBe(false);
		});

		it('should handle unwrap correctly', () => {
			const result = Ok('Success');
			expect(result.unwrap()).toBe('Success');
		});

		it('should support array destructuring', () => {
			const result = Ok('hello');
			const [ok, error, value] = result;

			expect(ok).toBe(true);
			expect(error).toBe(undefined);
			expect(value).toBe('hello');
		});

		it('should work with array methods', () => {
			const result = Ok(42);
			expect(result.length).toBe(3);
			expect(result[0]).toBe(true);
			expect(result[1]).toBe(undefined);
			expect(result[2]).toBe(42);
		});

		it('should handle null values correctly', () => {
			const result = Ok(null);
			expect(result.value).toBe(null);
			expect(result.unwrap()).toBe(null);
		});

		it('should handle undefined values correctly', () => {
			const result = Ok(undefined);
			expect(result.value).toBe(undefined);
			expect(result.unwrap()).toBe(undefined);
		});
	});

	describe('ErrResult class', () => {
		it('should create an Err result correctly', () => {
			const result = Err('Some error');
			expect(result.error).toBe('Some error');
			expect(() => result.unwrap()).toThrowError();
			expect(result.isOk()).toBe(false);
			expect(result.isErr()).toBe(true);
		});

		it('should throw error on unwrap', () => {
			const result = Err('Error occurred');
			expect(() => result.unwrap()).toThrow('Error occurred');
		});

		it('should support array destructuring', () => {
			const result = Err('oops');
			const [ok, error, value] = result;

			expect(ok).toBe(false);
			expect(error).toBe('oops');
			expect(value).toBe(undefined);
		});
	});

	describe('Ok() factory function', () => {
		it('should create OkResult instances', () => {
			const result = Ok(42);
			expect(result.value).toBe(42);
		});

		it('should handle multiple instances', () => {
			const okResult1 = Ok(1);
			const okResult2 = Ok(2);
			expect(okResult1.isOk()).toBe(true);
			expect(okResult2.isOk()).toBe(true);
		});
	});

	describe('Err() factory function', () => {
		it('should create ErrResult instances', () => {
			const result = Err('error');
			expect(result.error).toBe('error');
		});

		it('should handle multiple instances', () => {
			const errResult1 = Err('First error');
			const errResult2 = Err('Second error');
			expect(errResult1.isErr()).toBe(true);
			expect(errResult2.isErr()).toBe(true);
		});
	});

	describe('isOk() type guard', () => {
		it('should narrow types correctly for Ok results', () => {
			const okResult: TResult<number, string> = Ok(99);
			if (isOk(okResult)) {
				expect(okResult.value).toBe(99);
			} else {
				throw new Error('Expected okResult to be Ok');
			}
		});

		it('should return false for Err results', () => {
			const errResult = Err('Failure');
			expect(isOk(errResult)).toBe(false);
		});
	});

	describe('isErr() type guard', () => {
		it('should narrow types correctly for Err results', () => {
			const errResult: TResult<number, string> = Err('Failure');
			if (isErr(errResult)) {
				expect(errResult.error).toBe('Failure');
			} else {
				throw new Error('Expected errResult to be Err');
			}
		});

		it('should return false for Ok results', () => {
			const okResult = Ok(99);
			expect(isErr(okResult)).toBe(false);
		});
	});

	describe('unwrapOk() function', () => {
		it('should extract value from Ok result', () => {
			const result = Ok('Success');
			expect(unwrapOk(result)).toBe('Success');
		});

		it('should throw error for Err result', () => {
			const result = Err('Error occurred');
			expect(() => unwrapOk(result)).toThrow('Expected an Ok result');
		});
	});

	describe('unwrapErr() function', () => {
		it('should extract error from Err result', () => {
			const result = Err('Error occurred');
			expect(unwrapErr(result)).toBe('Error occurred');
		});

		it('should throw error for Ok result', () => {
			const result = Ok('No error');
			expect(() => unwrapErr(result)).toThrow('Expected an Err result');
		});
	});

	describe('unwrapOr() function', () => {
		it('should return value for Ok result', () => {
			const result = Ok(42);
			expect(unwrapOr(result, 0)).toBe(42);
		});

		it('should return default for Err result', () => {
			const result = Err('Error occurred');
			expect(unwrapOr(result, 0)).toBe(0);
		});
	});

	describe('unwrapOrNull() function', () => {
		it('should return value for Ok result', () => {
			const result = Ok(42);
			expect(unwrapOrNull(result)).toBe(42);
		});

		it('should return null for Err result', () => {
			const result = Err('Error occurred');
			expect(unwrapOrNull(result)).toBe(null);
		});
	});

	describe('serialize() function', () => {
		it('should serialize Ok result correctly', () => {
			const result = Ok('success');
			const serialized = serialize(result);
			expect(serialized).toEqual([true, 'success']);
		});

		it('should serialize Err result correctly', () => {
			const result = Err('error');
			const serialized = serialize(result);
			expect(serialized).toEqual([false, 'error']);
		});
	});

	describe('deserialize() function', () => {
		it('should deserialize Ok result correctly', () => {
			const serialized: [boolean, string] = [true, 'success'];
			const result = deserialize(serialized);
			expect(result.isOk()).toBe(true);
			expect(result.unwrap()).toBe('success');
		});

		it('should deserialize Err result correctly', () => {
			const serialized: [boolean, string] = [false, 'error'];
			const result = deserialize(serialized);
			expect(result.isOk()).toBe(false);
			expect(() => result.unwrap()).toThrow();
		});
	});

	describe('t() function wrapper', () => {
		it('should wrap successful sync functions', () => {
			const fn = (x: number) => x * 2;
			const result = t(fn, 21);
			expect(result.isOk()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});

		it('should wrap throwing functions', () => {
			const fn = () => {
				throw new Error('oops');
			};
			const result = t(fn);
			expect(result.isErr()).toBe(true);
			expect(result.error).toBeInstanceOf(Error);
		});
	});

	describe('tAsync() function wrapper', () => {
		it('should wrap resolved promises', async () => {
			const promise = Promise.resolve(42);
			const result = await tAsync(promise);
			expect(result.isOk()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});

		it('should wrap rejecting promises', async () => {
			const promise = Promise.reject('oops');
			const result = await tAsync(promise);
			expect(result.isErr()).toBe(true);
			expect(result.error).toBe('oops');
		});
	});

	describe('type safety', () => {
		it('should maintain type safety with getters', () => {
			const okResult = Ok(42);
			const errResult = Err('error');

			// TypeScript should know these types
			const okValue: number = okResult.value;
			const errError: string = errResult.error;

			expect(okValue).toBe(42);
			expect(errError).toBe('error');
		});
	});
});
