/**
 * A successful result. Structure: `[true, undefined, value]`.
 * Supports array destructuring as `[isOk, error, value]` and method-based access.
 */
export class OkResult<GValue, GError> extends Array<true | undefined | GValue> {
	declare 0: true;
	declare 1: undefined;
	declare 2: GValue;
	declare length: 3;

	constructor(value: GValue) {
		super(3);
		this[0] = true;
		this[1] = undefined;
		this[2] = value;
	}

	/** The success value. */
	public get value(): GValue {
		return this[2];
	}

	/** Always `undefined` for Ok results. */
	public get error(): GError | undefined {
		return this[1];
	}

	public isOk(): this is OkResult<GValue, GError> {
		return true;
	}

	public isErr(): this is ErrResult<GValue, GError> {
		return false;
	}

	/** Returns the success value. */
	public unwrap(): GValue {
		return this[2];
	}

	/** Converts to a plain serializable array `[true, undefined, value]`. */
	public toArray(): TOkResultArray<GValue> {
		return [true, undefined, this[2]];
	}
}

/**
 * An error result. Structure: `[false, error, undefined]`.
 * Supports array destructuring as `[isOk, error, value]` and method-based access.
 */
export class ErrResult<GValue, GError> extends Array<false | GError | undefined> {
	declare 0: false;
	declare 1: GError;
	declare 2: undefined;
	declare length: 3;

	constructor(error: GError) {
		super(3);
		this[0] = false;
		this[1] = error;
		this[2] = undefined;
	}

	/** Always `undefined` for Err results. */
	public get value(): GValue | undefined {
		return this[2];
	}

	/** The error value. */
	public get error(): GError {
		return this[1];
	}

	public isOk(): this is OkResult<GValue, GError> {
		return false;
	}

	public isErr(): this is ErrResult<GValue, GError> {
		return true;
	}

	/** Throws the stored error value exactly. */
	public unwrap(): never {
		// Note: Preserve the typed Err payload instead of coercing it into an Error
		throw this[1];
	}

	/** Converts to a plain serializable array `[false, error, undefined]`. */
	public toArray(): TErrResultArray<GError> {
		return [false, this[1], undefined];
	}
}

/** A method-based result instance. Supports array destructuring as `[isOk, error, value]`. */
export type TResult<GValue, GError> = OkResult<GValue, GError> | ErrResult<GValue, GError>;

/** Plain array form for successful results. The inactive error slot may be `null` after JSON parsing. */
export type TOkResultArray<GValue> = readonly [true, undefined | null, GValue];

/** Plain array form for error results. The inactive value slot may be `null` after JSON parsing. */
export type TErrResultArray<GError> = readonly [false, GError, undefined | null];

/** Plain result array: `[true, undefined | null, value]` or `[false, error, undefined | null]`. */
export type TResultArray<GValue, GError> = TOkResultArray<GValue> | TErrResultArray<GError>;

/** Any result shape accepted by helpers: method-based result instance or plain result array. */
export type TResultLike<GValue, GError> = TResult<GValue, GError> | TResultArray<GValue, GError>;

/** Creates a successful result. */
export function Ok<GValue, GError = never>(value: GValue): OkResult<GValue, GError> {
	return new OkResult(value);
}

export const ok = Ok;

/** Creates an error result. */
export function Err<GValue = never, GError = unknown>(error: GError): ErrResult<GValue, GError> {
	return new ErrResult(error);
}

export const err = Err;

/** Returns `true` and narrows to the successful result shape. */
export function isOk<GValue, GError>(
	result: TResultLike<GValue, GError>
): result is OkResult<GValue, GError> | TOkResultArray<GValue> {
	return result[0];
}

/** Returns `true` and narrows to the error result shape. */
export function isErr<GValue, GError>(
	result: TResultLike<GValue, GError>
): result is ErrResult<GValue, GError> | TErrResultArray<GError> {
	return !result[0];
}

/** Extracts the success value. Throws the stored error value exactly if the result is Err. */
export function unwrap<GValue, GError>(result: TResultLike<GValue, GError>): GValue {
	if (result[0]) {
		return result[2];
	}

	// Note: Preserve the typed Err payload instead of coercing it into an Error
	throw result[1];
}

/** Extracts the success value. Throws a generic `Error` if the result is not Ok. */
export function unwrapOk<GValue, GError>(result: TResultLike<GValue, GError>): GValue {
	if (result[0]) {
		return result[2];
	}

	throw new Error('Expected an Ok result');
}

/** Extracts the error value. Throws a generic `Error` if the result is not Err. */
export function unwrapErr<GValue, GError>(result: TResultLike<GValue, GError>): GError {
	if (!result[0]) {
		return result[1];
	}

	throw new Error('Expected an Err result');
}

/** Extracts the success value, returning `defaultValue` if the result is an error. */
export function unwrapOr<GValue, GError>(
	result: TResultLike<GValue, GError>,
	defaultValue: GValue
): GValue {
	return result[0] ? result[2] : defaultValue;
}

/** Extracts the success value, returning `null` if the result is an error. */
export function unwrapOrNull<GValue, GError>(result: TResultLike<GValue, GError>): GValue | null {
	return result[0] ? result[2] : null;
}

/** Extracts the success value, returning `undefined` if the result is an error. */
export function unwrapOrUndefined<GValue, GError>(
	result: TResultLike<GValue, GError>
): GValue | undefined {
	return result[0] ? result[2] : undefined;
}

/** Transforms the success value with `mapFn`. Passes errors through unchanged. */
export function mapOk<GValue, GError, GNextValue>(
	result: TResultLike<GValue, GError>,
	mapFn: (value: GValue) => GNextValue
): TResult<GNextValue, GError> {
	if (result[0]) {
		return Ok<GNextValue, GError>(mapFn(result[2]));
	}

	return Err<GNextValue, GError>(result[1]);
}

/** Transforms the error value with `mapFn`. Passes successes through unchanged. */
export function mapErr<GValue, GError, GNextError>(
	result: TResultLike<GValue, GError>,
	mapFn: (error: GError) => GNextError
): TResult<GValue, GNextError> {
	if (!result[0]) {
		return Err<GValue, GNextError>(mapFn(result[1]));
	}

	return Ok<GValue, GNextError>(result[2]);
}

/** Converts a result to a plain array with `undefined` in the inactive slot. */
export function toArray<GValue, GError>(
	result: TResultLike<GValue, GError>
): TResultArray<GValue, GError> {
	return result[0] ? [true, undefined, result[2]] : [false, result[1], undefined];
}

/** Reconstructs an `OkResult` or `ErrResult` instance from a result array. */
export function fromArray<GValue, GError>(
	result: TResultArray<GValue, GError>
): TResult<GValue, GError> {
	if (result[0]) {
		return Ok<GValue, GError>(result[2]);
	}

	return Err<GValue, GError>(result[1]);
}

/** Wraps a synchronous function call in a result. Returns `Err` if the function throws. */
export function t<GValue, GArgs extends unknown[]>(
	fn: (...args: GArgs) => GValue,
	...args: GArgs
): TResult<GValue, unknown> {
	try {
		return Ok<GValue, unknown>(fn(...args));
	} catch (error) {
		return Err<GValue, unknown>(error);
	}
}

/** Wraps a promise in a result. Returns `Err` if the promise rejects. */
export async function tAsync<GValue>(
	promise: PromiseLike<GValue>
): Promise<TResult<GValue, unknown>> {
	try {
		return Ok<GValue, unknown>(await promise);
	} catch (error) {
		return Err<GValue, unknown>(error);
	}
}

/** Calls the matching handler and returns its return value. */
export function match<GValue, GError, GReturn>(
	result: TResultLike<GValue, GError>,
	handlers: {
		ok: (value: GValue) => GReturn;
		err: (error: GError) => GReturn;
	}
): GReturn {
	if (result[0]) {
		return handlers.ok(result[2]);
	}

	return handlers.err(result[1]);
}
