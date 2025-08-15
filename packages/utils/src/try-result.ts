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
		Object.setPrototypeOf(this, OkResult.prototype);
	}

	get value(): T {
		return this[2];
	}

	get error(): E | undefined {
		return this[1];
	}

	isOk(): this is OkResult<T, E> {
		return true;
	}

	isErr(): this is ErrResult<T, E> {
		return false;
	}

	unwrap(): T {
		return this[2];
	}
}

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
		Object.setPrototypeOf(this, ErrResult.prototype);
	}

	get value(): T | undefined {
		return this[2];
	}

	get error(): E {
		return this[1];
	}

	isOk(): this is OkResult<T, E> {
		return false;
	}

	isErr(): this is ErrResult<T, E> {
		return true;
	}

	unwrap(): never {
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

export type TResult<T, E> = OkResult<T, E> | ErrResult<T, E>;

export function Ok<T, E>(value: T): OkResult<T, E> {
	return new OkResult(value);
}

export function Err<T, E>(error: E): ErrResult<T, E> {
	return new ErrResult(error);
}

export function isOk<T, E>(result: TResult<T, E>): result is OkResult<T, E> {
	return result instanceof OkResult;
}

export function isErr<T, E>(result: TResult<T, E>): result is ErrResult<T, E> {
	return result instanceof ErrResult;
}

export function unwrap<T, E>(result: TResult<T, E>): T {
	return result.unwrap();
}

export function unwrapOk<T, E>(result: TResult<T, E>): T {
	if (result[0]) {
		return result[2];
	}
	throw new Error('Expected an Ok result');
}

export function unwrapErr<T, E>(result: TResult<T, E>): E {
	if (!result[0]) {
		return result[1];
	}
	throw new Error('Expected an Err result');
}

export function unwrapOr<T, E>(result: TResult<T, E>, defaultValue: T): T {
	return result[0] ? result[2] : defaultValue;
}

export function unwrapOrNull<T, E>(result: TResult<T, E>): T | null {
	return unwrapOr(result, null as T | null);
}

export function serialize<T, E>(result: TResult<T, E>): [boolean, T | E] {
	if (result[0]) {
		return [true, result[2]];
	} else {
		return [false, result[1]];
	}
}

export function deserialize<T, E>(serialized: [boolean, T | E]): TResult<T, E> {
	if (serialized[0]) {
		return Ok(serialized[1] as T);
	} else {
		return Err(serialized[1] as E);
	}
}

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

export async function tAsync<T>(promise: Promise<T>): Promise<TResult<T, unknown>> {
	try {
		const result = await promise;
		return Ok(result);
	} catch (error) {
		return Err<T, unknown>(error);
	}
}
