/**
 * Represents a successful result as an array with literal types.
 * Structure: [true, undefined, T] where T is the success value.
 * Extends Array to provide both array destructuring and common Result methods.
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

	/**
	 * Gets the success value from this result.
	 * @returns The success value of type T
	 */
	public get value(): T {
		return this[2];
	}

	/**
	 * Gets the error value (always undefined for Ok results).
	 * @returns Always undefined for Ok results
	 */
	public get error(): E | undefined {
		return this[1];
	}

	/**
	 * Type guard to check if this result is successful.
	 * @returns Always true for OkResult instances
	 */
	public isOk(): this is OkResult<T, E> {
		return true;
	}

	/**
	 * Type guard to check if this result is an error.
	 * @returns Always false for OkResult instances
	 */
	public isErr(): this is ErrResult<T, E> {
		return false;
	}

	/**
	 * Extracts the success value from this result.
	 * @returns The success value of type T
	 */
	public unwrap(): T {
		return this[2];
	}

	/**
	 * Converts the result to a plain array for serialization.
	 * @returns A plain array [true, undefined, T]
	 */
	public toArray(): [true, undefined, T] {
		return [true, undefined, this[2]];
	}
}

/**
 * Represents an error result as an array with literal types.
 * Structure: [false, E, undefined] where E is the error value.
 * Extends Array to provide both array destructuring and common Result methods.
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

	/**
	 * Gets the success value (always undefined for Err results).
	 * @returns Always undefined for Err results
	 */
	public get value(): T | undefined {
		return this[2];
	}

	/**
	 * Gets the error value from this result.
	 * @returns The error value of type E
	 */
	public get error(): E {
		return this[1];
	}

	/**
	 * Type guard to check if this result is successful.
	 * @returns Always false for ErrResult instances
	 */
	public isOk(): this is OkResult<T, E> {
		return false;
	}

	/**
	 * Type guard to check if this result is an error.
	 * @returns Always true for ErrResult instances
	 */
	public isErr(): this is ErrResult<T, E> {
		return true;
	}

	/**
	 * Attempts to extract the success value, but always throws since this is an error result.
	 * @throws The error contained in this result
	 */
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

	/**
	 * Converts the result to a plain array for serialization.
	 * @returns A plain array [false, E, undefined]
	 */
	public toArray(): [false, E, undefined] {
		return [false, this[1], undefined];
	}
}

/**
 * Union type representing either a successful or error result.
 * Can be destructured as [boolean, E | undefined, T | undefined].
 */
export type TResult<T, E> = OkResult<T, E> | ErrResult<T, E>;

/**
 * Represents a result as a plain array.
 * Can be destructured as [boolean, E | undefined, T | undefined].
 */
export type TResultArray<T, E> = [true, undefined, T] | [false, E, undefined];

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
export function isOk<T, E>(result: TResult<T, E>): result is OkResult<T, E>;
export function isOk<T, E>(result: TResultArray<T, E>): result is [true, undefined, T];
export function isOk<T, E>(
	result: TResult<T, E> | TResultArray<T, E>
): result is OkResult<T, E> | [true, undefined, T] {
	return result[0];
}

/**
 * Type guard to check if a result is an error.
 * @param result - The result to check
 * @returns True if the result is Err, false otherwise
 */
export function isErr<T, E>(result: TResult<T, E>): result is ErrResult<T, E>;
export function isErr<T, E>(result: TResultArray<T, E>): result is [false, E, undefined];
export function isErr<T, E>(
	result: TResult<T, E> | TResultArray<T, E>
): result is ErrResult<T, E> | [false, E, undefined] {
	return !result[0];
}

/**
 * Extracts the value from a result, throwing if it's an error.
 * @param result - The result to unwrap
 * @returns The success value
 * @throws The error if the result is Err
 */
export function unwrap<T, E>(result: TResult<T, E>): T;
export function unwrap<T, E>(result: TResultArray<T, E>): T;
export function unwrap<T, E>(result: TResult<T, E> | TResultArray<T, E>): T {
	if (result[0]) {
		return result[2];
	}

	const error = result[1];
	if (error instanceof Error) {
		throw error;
	} else if (typeof error === 'string') {
		throw new Error(error);
	} else {
		throw new Error('Unknown error');
	}
}

/**
 * Extracts the value from an Ok result, throwing if it's an error.
 * @param result - The result to unwrap
 * @returns The success value
 * @throws Error if the result is not Ok
 */
export function unwrapOk<T, E>(result: TResult<T, E>): T;
export function unwrapOk<T, E>(result: TResultArray<T, E>): T;
export function unwrapOk<T, E>(result: TResult<T, E> | TResultArray<T, E>): T {
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
export function unwrapErr<T, E>(result: TResult<T, E>): E;
export function unwrapErr<T, E>(result: TResultArray<T, E>): E;
export function unwrapErr<T, E>(result: TResult<T, E> | TResultArray<T, E>): E {
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
export function unwrapOr<T, E>(result: TResult<T, E>, defaultValue: T): T;
export function unwrapOr<T, E>(result: TResultArray<T, E>, defaultValue: T): T;
export function unwrapOr<T, E>(result: TResult<T, E> | TResultArray<T, E>, defaultValue: T): T {
	return result[0] ? result[2] : defaultValue;
}

/**
 * Extracts the value from a result, returning null if it's an error.
 * @param result - The result to unwrap
 * @returns The success value or null
 */
export function unwrapOrNull<T, E>(result: TResultArray<T, E>): T | null;
export function unwrapOrNull<T, E>(result: TResult<T, E>): T | null;
export function unwrapOrNull<T, E>(result: TResult<T, E> | TResultArray<T, E>): T | null {
	return result[0] ? result[2] : null;
}

/**
 * Extracts the value from a result, returning undefined if it's an error.
 * @param result - The result to unwrap
 * @returns The success value or undefined
 */
export function unwrapOrUndefined<T, E>(result: TResultArray<T, E>): T | undefined;
export function unwrapOrUndefined<T, E>(result: TResult<T, E>): T | undefined;
export function unwrapOrUndefined<T, E>(result: TResult<T, E> | TResultArray<T, E>): T | undefined {
	return result[0] ? result[2] : undefined;
}

/**
 * Maps the value inside an Ok result using the provided function.
 * Returns a new result with the mapped value or the original error.
 * @param result - The result to map
 * @param mapFn - Function to transform the success value
 * @returns A new result with the mapped value or the original error
 */
export function mapOk<T, E, U>(result: TResult<T, E>, mapFn: (value: T) => U): TResult<U, E>;
export function mapOk<T, E, U>(result: TResultArray<T, E>, mapFn: (value: T) => U): TResult<U, E>;
export function mapOk<T, E, U>(
	result: TResult<T, E> | TResultArray<T, E>,
	mapFn: (value: T) => U
): TResult<U, E> {
	if (result[0]) {
		return Ok(mapFn(result[2]));
	}
	return Err(result[1]);
}

/**
 * Maps the error inside an Err result using the provided function.
 * Returns a new result with the mapped error or the original success value.
 * @param result - The result to map
 * @param mapFn - Function to transform the error value
 * @returns A new result with the mapped error or the original success value
 */
export function mapErr<T, E, F>(result: TResult<T, E>, mapFn: (error: E) => F): TResult<T, F>;
export function mapErr<T, E, F>(result: TResultArray<T, E>, mapFn: (error: E) => F): TResult<T, F>;
export function mapErr<T, E, F>(
	result: TResult<T, E> | TResultArray<T, E>,
	mapFn: (error: E) => F
): TResult<T, F> {
	if (!result[0]) {
		return Err(mapFn(result[1]));
	}
	return Ok(result[2]);
}

/**
 * Converts a result to a plain array for serialization.
 * @param result - The result to convert
 * @returns A plain array representation
 */
export function toArray<T, E>(result: TResult<T, E>): TResultArray<T, E>;
export function toArray<T, E>(result: TResultArray<T, E>): TResultArray<T, E>;
export function toArray<T, E>(result: TResult<T, E> | TResultArray<T, E>): TResultArray<T, E> {
	return result[0] ? [true, undefined, result[2]] : [false, result[1], undefined];
}

/**
 * Creates a result from a plain array.
 * @param array - The array to convert
 * @returns A result instance with methods
 */
export function fromArray<T, E>(array: TResultArray<T, E>): TResult<T, E>;
export function fromArray<T, E>(array: TResult<T, E>): TResult<T, E>;
export function fromArray<T, E>(array: TResult<T, E> | TResultArray<T, E>): TResult<T, E> {
	if (array[0]) {
		return new OkResult(array[2] as T);
	} else {
		return new ErrResult(array[1] as E);
	}
}

/**
 * Wraps a synchronous function call in a result.
 * @param fn - The function to wrap
 * @param args - Arguments to pass to the function
 * @returns A result containing the function's return value or error
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
 * @returns A Promise that resolves to a result
 */
export async function tAsync<T>(promise: Promise<T>): Promise<TResult<T, unknown>> {
	try {
		const result = await promise;
		return Ok(result);
	} catch (error) {
		return Err<T, unknown>(error);
	}
}

/**
 * Pattern matches on a result, calling the appropriate handler.
 * Similar to Rust's match! macro but following KISS principles.
 * @param result - The result to match on
 * @param handlers - Object with ok and err handlers
 * @returns The result of calling the appropriate handler
 */
export function match<T, E, R>(
	result: TResult<T, E>,
	handlers: {
		ok: (value: T) => R;
		err: (error: E) => R;
	}
): R;
export function match<T, E, R>(
	result: TResultArray<T, E>,
	handlers: {
		ok: (value: T) => R;
		err: (error: E) => R;
	}
): R;
export function match<T, E, R>(
	result: TResult<T, E> | TResultArray<T, E>,
	handlers: {
		ok: (value: T) => R;
		err: (error: E) => R;
	}
): R {
	if (result[0]) {
		return handlers.ok(result[2]);
	}
	return handlers.err(result[1]);
}
