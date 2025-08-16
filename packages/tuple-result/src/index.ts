/**
 * Represents a successful result as an array with literal types.
 * Structure: [true, undefined, T] where T is the success value.
 * Extends Array to provide both array destructuring and Result methods.
 */
export class OkResult<T, E> extends Array<true | undefined | T> {
	declare 0: true;
	declare 1: undefined;
	declare 2: T;
	declare length: 3;

	constructor(value: T) {
		super(3);
		this[0] = true;
		this[1] = undefined;
		this[2] = value;
	}

	public get value(): T {
		return this[2];
	}

	public get error(): E | undefined {
		return this[1];
	}

	public isOk(): this is OkResult<T, E> {
		return true;
	}

	public isErr(): this is ErrResult<T, E> {
		return false;
	}

	public unwrap(): T {
		return this[2];
	}
}

/**
 * Represents an error result as an array with literal types.
 * Structure: [false, E, undefined] where E is the error value.
 * Extends Array to provide both array destructuring and Result methods.
 */
export class ErrResult<T, E> extends Array<false | E | undefined> {
	declare 0: false;
	declare 1: E;
	declare 2: undefined;
	declare length: 3;

	constructor(error: E) {
		super(3);
		this[0] = false;
		this[1] = error;
		this[2] = undefined;
	}

	public get value(): T | undefined {
		return this[2];
	}

	public get error(): E {
		return this[1];
	}

	public isOk(): this is OkResult<T, E> {
		return false;
	}

	public isErr(): this is ErrResult<T, E> {
		return true;
	}

	public unwrap(): never {
		const error = this[1];
		if (error instanceof Error) {
			throw error;
		} else if (typeof error === 'string') {
			throw new Error(error);
		} else {
			throw new Error('Unknown error');
		}
	}
}

/**
 * Union type representing either a successful or error result.
 * Can be destructured as [boolean, E | undefined, T | undefined].
 */
export type TResult<T, E> = OkResult<T, E> | ErrResult<T, E>;

/**
 * Creates a successful result containing the given value.
 * @param value - The success value to wrap
 * @returns An OkResult instance
 */
export function Ok<T, E>(value: T): OkResult<T, E> {
	return new OkResult(value);
}

export const ok = Ok;

/**
 * Creates an error result containing the given error.
 * @param error - The error value to wrap
 * @returns An ErrResult instance
 */
export function Err<T, E>(error: E): ErrResult<T, E> {
	return new ErrResult(error);
}

export const err = Err;

/**
 * Type guard to check if a result is successful.
 * @param result - The result to check
 * @returns True if the result is Ok, false otherwise
 */
export function isOk<T, E>(result: TResult<T, E>): result is OkResult<T, E> {
	return result instanceof OkResult;
}

/**
 * Type guard to check if a result is an error.
 * @param result - The result to check
 * @returns True if the result is Err, false otherwise
 */
export function isErr<T, E>(result: TResult<T, E>): result is ErrResult<T, E> {
	return result instanceof ErrResult;
}

/**
 * Extracts the value from a result, throwing if it's an error.
 * @param result - The result to unwrap
 * @returns The success value
 * @throws The error if the result is Err
 */
export function unwrap<T, E>(result: TResult<T, E>): T {
	return result.unwrap();
}

/**
 * Extracts the value from an Ok result, throwing if it's an error.
 * @param result - The result to unwrap
 * @returns The success value
 * @throws Error if the result is not Ok
 */
export function unwrapOk<T, E>(result: TResult<T, E>): T {
	if (result[0]) {
		return result[2];
	}
	throw new Error('Expected an Ok result');
}

/**
 * Extracts the error from an Err result, throwing if it's successful.
 * @param result - The result to unwrap
 * @returns The error value
 * @throws Error if the result is not Err
 */
export function unwrapErr<T, E>(result: TResult<T, E>): E {
	if (!result[0]) {
		return result[1];
	}
	throw new Error('Expected an Err result');
}

/**
 * Extracts the value from a result, returning a default if it's an error.
 * @param result - The result to unwrap
 * @param defaultValue - The value to return if the result is Err
 * @returns The success value or the default value
 */
export function unwrapOr<T, E>(result: TResult<T, E>, defaultValue: T): T {
	return result[0] ? result[2] : defaultValue;
}

/**
 * Extracts the value from a result, returning null if it's an error.
 * @param result - The result to unwrap
 * @returns The success value or null
 */
export function unwrapOrNull<T, E>(result: TResult<T, E>): T | null {
	return unwrapOr(result, null as T | null);
}

/**
 * Maps the value inside an Ok result using the provided function.
 * If the input is an Err result, it returns the Err result unchanged.
 * @param result - The result to map
 * @param mapFn - Function to transform the success value
 * @returns A new Result with the mapped value or the original error
 */
export function mapOk<T, E, U>(result: TResult<T, E>, mapFn: (value: T) => U): TResult<U, E> {
	if (result[0]) {
		return Ok(mapFn(result[2]));
	}
	return Err(result[1]);
}

/**
 * Maps the error inside an Err result using the provided function.
 * If the input is an Ok result, it returns the Ok result unchanged.
 * @param result - The result to map
 * @param mapFn - Function to transform the error value
 * @returns A new Result with the mapped error or the original success value
 */
export function mapErr<T, E, F>(result: TResult<T, E>, mapFn: (error: E) => F): TResult<T, F> {
	if (!result[0]) {
		return Err(mapFn(result[1]));
	}
	return Ok(result[2]);
}

/**
 * Converts a result to a wire-friendly format.
 * @param result - The result to serialize
 * @returns A tuple [boolean, T | E] for transmission
 */
export function serialize<T, E>(result: TResult<T, E>): [boolean, T | E] {
	if (result[0]) {
		return [true, result[2]];
	} else {
		return [false, result[1]];
	}
}

/**
 * Converts a serialized result back to a TResult.
 * @param serialized - The serialized tuple [boolean, T | E]
 * @returns A TResult instance
 */
export function deserialize<T, E>(serialized: [boolean, T | E]): TResult<T, E> {
	if (serialized[0]) {
		return Ok(serialized[1] as T);
	} else {
		return Err(serialized[1] as E);
	}
}

/**
 * Wraps a synchronous function call in a Result.
 * @param fn - The function to wrap
 * @param args - Arguments to pass to the function
 * @returns A Result containing the function's return value or error
 */
export function t<T, Args extends any[]>(
	fn: (...args: Args) => T,
	...args: Args
): TResult<T, unknown> {
	try {
		const result = fn(...args);
		return Ok(result as T);
	} catch (error) {
		return Err(error);
	}
}

/**
 * Wraps a Promise in a Result.
 * @param promise - The promise to wrap
 * @returns A Promise that resolves to a Result
 */
export async function tAsync<T>(promise: Promise<T>): Promise<TResult<T, unknown>> {
	try {
		const result = await promise;
		return Ok(result);
	} catch (error) {
		return Err<T, unknown>(error);
	}
}
