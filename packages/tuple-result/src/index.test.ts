import { describe, expect, it } from 'vitest';
import {
	Err,
	fromArray,
	isErr,
	isOk,
	mapErr,
	mapOk,
	Ok,
	t,
	tAsync,
	toArray,
	unwrapErr,
	unwrapOk,
	unwrapOr,
	unwrapOrNull,
	type TResult
} from './index';

describe('tuple-result', () => {
	describe('OkResult class', () => {
		it('should create Ok results with correct behavior', () => {
			const result = Ok(42);
			expect(result.value).toBe(42);
			expect(result.unwrap()).toBe(42);
			expect(result.isOk()).toBe(true);
			expect(result.isErr()).toBe(false);
		});

		it('should support array destructuring', () => {
			const result = Ok('hello');
			const [ok, error, value] = result;
			expect(ok).toBe(true);
			expect(error).toBe(undefined);
			expect(value).toBe('hello');
		});

		it('should handle edge cases', () => {
			const result = Ok(null);
			expect(result.value).toBe(null);
			expect(result.unwrap()).toBe(null);
		});
	});

	describe('ErrResult class', () => {
		it('should create Err results with correct behavior', () => {
			const result = Err('Some error');
			expect(result.error).toBe('Some error');
			expect(() => result.unwrap()).toThrowError();
			expect(result.isOk()).toBe(false);
			expect(result.isErr()).toBe(true);
		});

		it('should support array destructuring', () => {
			const result = Err('oops');
			const [ok, error, value] = result;
			expect(ok).toBe(false);
			expect(error).toBe('oops');
			expect(value).toBe(undefined);
		});
	});

	describe('isOk function', () => {
		it('should narrow types correctly', () => {
			const okResult: TResult<number, string> = Ok(99);
			if (isOk(okResult)) {
				expect(okResult.value).toBe(99);
			}
		});
	});

	describe('isErr function', () => {
		it('should narrow types correctly', () => {
			const errResult: TResult<number, string> = Err('Failure');
			if (isErr(errResult)) {
				expect(errResult.error).toBe('Failure');
			}
		});
	});

	describe('unwrapOk function', () => {
		it('should extract value from Ok result', () => {
			const result = Ok('Success');
			expect(unwrapOk(result)).toBe('Success');
		});

		it('should throw error for Err result', () => {
			const result = Err('Error occurred');
			expect(() => unwrapOk(result)).toThrow();
		});
	});

	describe('unwrapErr function', () => {
		it('should extract error from Err result', () => {
			const result = Err('Error occurred');
			expect(unwrapErr(result)).toBe('Error occurred');
		});

		it('should throw error for Ok result', () => {
			const result = Ok('No error');
			expect(() => unwrapErr(result)).toThrow();
		});
	});

	describe('unwrapOr function', () => {
		it('should return value for Ok result', () => {
			const result = Ok(42);
			expect(unwrapOr(result, 0)).toBe(42);
		});

		it('should return default for Err result', () => {
			const result = Err('Error occurred');
			expect(unwrapOr(result, 0)).toBe(0);
		});
	});

	describe('unwrapOrNull function', () => {
		it('should return value for Ok result', () => {
			const result = Ok(42);
			expect(unwrapOrNull(result)).toBe(42);
		});

		it('should return null for Err result', () => {
			const result = Err('Error occurred');
			expect(unwrapOrNull(result)).toBe(null);
		});
	});

	describe('mapOk function', () => {
		it('should transform Ok values', () => {
			const result = Ok(21);
			const doubled = mapOk(result, (x: number) => x * 2);
			expect(doubled.unwrap()).toBe(42);
		});

		it('should leave Err results unchanged', () => {
			const result = Err('Error occurred');
			const mapped = mapOk(result, (x: number) => x * 2);
			expect(mapped.isErr()).toBe(true);
			expect(mapped.error).toBe('Error occurred');
		});
	});

	describe('mapErr function', () => {
		it('should transform Err values', () => {
			const result = Err('Error occurred');
			const wrapped = mapErr(result, (err) => `Wrapped: ${err}`);
			expect(wrapped.error).toBe('Wrapped: Error occurred');
		});

		it('should leave Ok results unchanged', () => {
			const result = Ok(42);
			const mapped = mapErr(result, (err) => `Wrapped: ${err}`);
			expect(mapped.isOk()).toBe(true);
			expect(mapped.unwrap()).toBe(42);
		});
	});

	describe('toArray function', () => {
		it('should convert Ok and Err results to arrays', () => {
			const okResult = Ok('success');
			const errResult = Err('error');

			expect(toArray(okResult)).toEqual([true, undefined, 'success']);
			expect(toArray(errResult)).toEqual([false, 'error', undefined]);
		});
	});

	describe('fromArray function', () => {
		it('should create results from arrays', () => {
			const okArray: [true, undefined, string] = [true, undefined, 'success'];
			const errArray: [false, string, undefined] = [false, 'error', undefined];

			const okResult = fromArray(okArray);
			const errResult = fromArray(errArray);

			expect(okResult.unwrap()).toBe('success');
			expect(() => errResult.unwrap()).toThrow();
		});
	});

	describe('t function', () => {
		it('should wrap successful and throwing functions', () => {
			const successFn = (x: number) => x * 2;
			const result = t(successFn, 21);
			expect(result.unwrap()).toBe(42);

			const throwingFn = () => {
				throw new Error('oops');
			};
			const errorResult = t(throwingFn);
			expect(errorResult.isErr()).toBe(true);
		});
	});

	describe('tAsync function', () => {
		it('should wrap resolved and rejected promises', async () => {
			const promise = Promise.resolve(42);
			const result = await tAsync(promise);
			expect(result.unwrap()).toBe(42);

			const rejectingPromise = Promise.reject('oops');
			const errorResult = await tAsync(rejectingPromise);
			expect(errorResult.isErr()).toBe(true);
		});
	});
});
