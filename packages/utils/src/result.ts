export type TResultError = string | Error;

export interface TOkResult<T, E extends TResultError> {
	_type: 'Ok';
	value: T;
	unwrap: () => T;
	isOk: () => this is TOkResult<T, E>;
	isErr: () => this is TErrResult<T, E>;
}

export interface TErrResult<T, E extends TResultError> {
	_type: 'Err';
	error: E;
	unwrap: () => T;
	isOk: () => this is TOkResult<T, E>;
	isErr: () => this is TErrResult<T, E>;
}

export type TResult<T, E extends TResultError> = TOkResult<T, E> | TErrResult<T, E>;

// Factory function for creating an Ok result
export function Ok<T, E extends TResultError>(value: T): TOkResult<T, E> {
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
export function Err<T, E extends TResultError>(error: E): TErrResult<T, E> {
	return {
		_type: 'Err',
		error,
		unwrap() {
			if (error instanceof Error) {
				throw error;
			} else {
				throw new Error(error);
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
export function unwrapOk<T, E extends TResultError>(result: TResult<T, E>): T {
	if (result.isOk()) {
		return result.value;
	}
	throw new Error('Expected an Ok result');
}

// Extracts error from an Err result or throws an error if it's an Ok
export function unwrapErr<T, E extends TResultError>(result: TResult<T, E>): E {
	if (result.isErr()) {
		return result.error;
	}
	throw new Error('Expected an Err result');
}
