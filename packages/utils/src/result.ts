export interface TOkResult<T, E> {
	_type: 'Ok';
	value: T;
	unwrap: () => T;
	isOk: () => this is TOkResult<T, E>;
	isErr: () => this is TErrResult<T, E>;
}

export interface TErrResult<T, E> {
	_type: 'Err';
	error: E;
	unwrap: () => T;
	isOk: () => this is TOkResult<T, E>;
	isErr: () => this is TErrResult<T, E>;
}

export type TResult<T, E> = TOkResult<T, E> | TErrResult<T, E>;

// Factory function for creating an Ok result
export function Ok<T, E>(value: T): TOkResult<T, E> {
	return {
		_type: 'Ok',
		value,
		unwrap() {
			return value;
		},
		// @ts-expect-error -- Assignable
		isOk() {
			return true;
		},
		// @ts-expect-error -- Assignable
		isErr() {
			return false;
		}
	};
}

// Factory function for creating an Err result
export function Err<T, E>(error: E): TErrResult<T, E> {
	return {
		_type: 'Err',
		error,
		unwrap() {
			if (error instanceof Error) {
				throw error;
			} else if (typeof error === 'string') {
				throw new Error(error);
			} else {
				throw new Error('Unknown error');
			}
		},
		// @ts-expect-error -- Assignable
		isOk() {
			return false;
		},
		// @ts-expect-error -- Assignable
		isErr() {
			return true;
		}
	};
}

// Extracts value from an Ok result or throws an error if it's an Err
export function unwrapOk<T, E>(result: TResult<T, E>): T {
	if (result.isOk()) {
		return result.value;
	}
	throw new Error('Expected an Ok result');
}

// Extracts error from an Err result or throws an error if it's an Ok
export function unwrapErr<T, E>(result: TResult<T, E>): E {
	if (result.isErr()) {
		return result.error;
	}
	throw new Error('Expected an Err result');
}

// Maps the value inside an Ok result using the provided function, returning a new Ok result.
// If the input is an Err result, it returns the Err result unchanged.
export function mapOk<T, E, U>(result: TResult<T, E>, mapFn: (value: T) => U): TResult<U, E> {
	if (result.isOk()) {
		return Ok(mapFn(result.value));
	}
	return Err(result.error);
}

// Maps the error inside an Err result using the provided function, returning a new Err result.
// If the input is an Ok result, it returns the Ok result unchanged.
export function mapErr<T, E, F>(result: TResult<T, E>, mapFn: (error: E) => F): TResult<T, F> {
	if (result.isErr()) {
		return Err(mapFn(result.error));
	}
	return Ok(result.value);
}

// Returns the value inside an Ok result or null if it's an Err.
export function unwrapOrNull<T, E>(result: TResult<T, E>): T | null {
	return unwrapOr(result, null as T | null);
}

// Returns the value inside an Ok result or the specified default value if it's an Err.
export function unwrapOr<T, E>(result: TResult<T, E>, defaultValue: T): T {
	if (result.isOk()) {
		return result.value;
	}
	return defaultValue;
}
