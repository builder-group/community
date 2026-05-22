import { describe, expect, expectTypeOf, it } from 'vitest';
import {
	Err,
	err,
	fromArray,
	isErr,
	isOk,
	mapErr,
	mapOk,
	match,
	Ok,
	ok,
	t,
	tAsync,
	toArray,
	unwrap,
	unwrapErr,
	unwrapOk,
	unwrapOr,
	unwrapOrNull,
	unwrapOrUndefined,
	type TResult,
	type TResultArray
} from './index';

describe('tuple-result package', () => {
	describe('constructors', () => {
		it('should create destructurable Ok results', () => {
			// Prepare
			const userResult = Ok({ name: 'Ada' });

			// Act
			const [isUserOk, userErr, user] = userResult;

			// Assert
			expect(isUserOk).toBe(true);
			expect(userErr).toBeUndefined();
			expect(user).toEqual({ name: 'Ada' });
			expect(userResult.value).toEqual({ name: 'Ada' });
			expect(userResult.unwrap()).toEqual({ name: 'Ada' });
			expect(userResult.isOk()).toBe(true);
			expect(userResult.isErr()).toBe(false);
		});

		it('should create destructurable Err results', () => {
			// Prepare
			const configResult = Err<{ url: string }, string>('Missing config');

			// Act
			const [isConfigOk, configErr, config] = configResult;

			// Assert
			expect(isConfigOk).toBe(false);
			expect(configErr).toBe('Missing config');
			expect(config).toBeUndefined();
			expect(configResult.error).toBe('Missing config');
			expect(configResult.isOk()).toBe(false);
			expect(configResult.isErr()).toBe(true);
		});

		it('should expose lowercase constructor aliases', () => {
			// Assert
			expect(ok('value').value).toBe('value');
			expect(err('error').error).toBe('error');
		});
	});

	describe('type guards', () => {
		it('should narrow method-based result instances', () => {
			// Prepare
			const userResult: TResult<{ name: string }, Error> = Ok({ name: 'Ada' });

			// Assert
			if (isOk(userResult)) {
				expectTypeOf(userResult.value).toEqualTypeOf<{ name: string }>();
				expect(userResult.value.name).toBe('Ada');
			}
		});

		it('should narrow plain result arrays', () => {
			// Prepare
			const configResult = createConfigArrayResult();

			// Assert
			if (isErr(configResult)) {
				expectTypeOf(configResult[1]).toEqualTypeOf<string>();
				expect(configResult[1]).toBe('Missing config');
			}
		});
	});

	describe('unwrapping', () => {
		it('should unwrap success values', () => {
			// Prepare
			const userResult = Ok({ name: 'Ada' });

			// Assert
			expect(unwrap(userResult)).toEqual({ name: 'Ada' });
			expect(unwrapOk(userResult)).toEqual({ name: 'Ada' });
		});

		it('should unwrap error values', () => {
			// Prepare
			const configResult = Err<{ url: string }, string>('Missing config');

			// Assert
			expect(unwrapErr(configResult)).toBe('Missing config');
		});

		it('should throw the stored error when unwrapping Err results', () => {
			// Prepare
			const configErr = { code: 'missing_config' };
			const configResult = Err(configErr);
			let thrownByFunction: unknown;
			let thrownByMethod: unknown;

			// Act
			try {
				unwrap(configResult);
			} catch (error) {
				thrownByFunction = error;
			}
			try {
				configResult.unwrap();
			} catch (error) {
				thrownByMethod = error;
			}

			// Assert
			expect(thrownByFunction).toBe(configErr);
			expect(thrownByMethod).toBe(configErr);
		});

		it('should throw branch assertion errors when unwrapping the wrong branch', () => {
			// Assert
			expect(() => unwrapOk(Err('Missing value'))).toThrow('Expected an Ok result');
			expect(() => unwrapErr(Ok('value'))).toThrow('Expected an Err result');
		});

		it('should use fallback values for Err results', () => {
			// Prepare
			const userResult = Err<{ name: string }, string>('Missing user');

			// Assert
			expect(unwrapOr(userResult, { name: 'Fallback' })).toEqual({ name: 'Fallback' });
			expect(unwrapOrNull(userResult)).toBeNull();
			expect(unwrapOrUndefined(userResult)).toBeUndefined();
		});
	});

	describe('transformation', () => {
		it('should transform success values and pass errors through', () => {
			// Prepare
			const countResult = Ok<number, string>(21);
			const missingCountResult = Err<number, string>('Missing count');

			// Act
			const doubledCountResult = mapOk(countResult, (count) => count * 2);
			const unchangedMissingCountResult = mapOk(missingCountResult, (count) => count * 2);

			// Assert
			expect(unwrap(doubledCountResult)).toBe(42);
			expect(unwrapErr(unchangedMissingCountResult)).toBe('Missing count');
		});

		it('should transform error values and pass successes through', () => {
			// Prepare
			const countResult = Ok<number, number>(42);
			const missingCountResult = Err<number, number>(404);

			// Act
			const unchangedCountResult = mapErr(countResult, (code) => `HTTP ${code}`);
			const wrappedMissingCountResult = mapErr(missingCountResult, (code) => `HTTP ${code}`);

			// Assert
			expect(unwrap(unchangedCountResult)).toBe(42);
			expect(unwrapErr(wrappedMissingCountResult)).toBe('HTTP 404');
		});

		it('should match on both result branches', () => {
			// Prepare
			const userResult = Ok<{ name: string }, string>({ name: 'Ada' });
			const missingUserResult = Err<{ name: string }, string>('Missing user');

			// Act
			const userLabel = match(userResult, {
				ok: (user) => user.name,
				err: (userErr) => userErr
			});
			const missingUserLabel = match(missingUserResult, {
				ok: (user) => user.name,
				err: (userErr) => userErr
			});

			// Assert
			expect(userLabel).toBe('Ada');
			expect(missingUserLabel).toBe('Missing user');
		});
	});

	describe('wrappers', () => {
		it('should wrap synchronous functions', () => {
			// Prepare
			const parseConfig = (input: string) => JSON.parse(input) as { port: number };
			const parseErr = new SyntaxError('Invalid JSON');

			// Act
			const configResult = t(parseConfig, '{"port":3000}');
			const invalidConfigResult = t(() => {
				throw parseErr;
			});

			// Assert
			expect(unwrap(configResult)).toEqual({ port: 3000 });
			expect(unwrapErr(invalidConfigResult)).toBe(parseErr);
		});

		it('should wrap promises', async () => {
			// Prepare
			const requestErr = new Error('Request failed');

			// Act
			const userResult = await tAsync(Promise.resolve({ name: 'Ada' }));
			const missingUserResult = await tAsync(Promise.reject(requestErr));

			// Assert
			expect(unwrap(userResult)).toEqual({ name: 'Ada' });
			expect(unwrapErr(missingUserResult)).toBe(requestErr);
		});
	});

	describe('serialization', () => {
		it('should convert method-based results to plain arrays', () => {
			// Prepare
			const userResult = Ok<{ name: string }, string>({ name: 'Ada' });
			const missingUserResult = Err<{ name: string }, string>('Missing user');

			// Act
			const userArray = toArray(userResult);
			const missingUserArray = toArray(missingUserResult);

			// Assert
			expect(userArray).toEqual([true, undefined, { name: 'Ada' }]);
			expect(missingUserArray).toEqual([false, 'Missing user', undefined]);
		});

		it('should reconstruct method-based results from plain arrays', () => {
			// Prepare
			const userArray = [true, undefined, { name: 'Ada' }] as const satisfies TResultArray<
				{ name: string },
				string
			>;
			const missingUserArray = [false, 'Missing user', undefined] as const satisfies TResultArray<
				{ name: string },
				string
			>;

			// Act
			const userResult = fromArray(userArray);
			const missingUserResult = fromArray(missingUserArray);

			// Assert
			expect(unwrap(userResult)).toEqual({ name: 'Ada' });
			expect(unwrapErr(missingUserResult)).toBe('Missing user');
		});

		it('should support JSON roundtrips', () => {
			// Prepare
			const countResult = Ok<number, string>(42);
			const missingCountResult = Err<number, string>('Missing count');

			// Act
			const countArray = JSON.parse(JSON.stringify(countResult)) as TResultArray<number, string>;
			const missingCountArray = JSON.parse(JSON.stringify(missingCountResult)) as TResultArray<
				number,
				string
			>;

			// Assert
			expect(JSON.stringify(Ok(42))).toBe('[true,null,42]');
			expect(JSON.stringify(Err('error'))).toBe('[false,"error",null]');
			expect(unwrap(countArray)).toBe(42);
			expect(unwrapErr(missingCountArray)).toBe('Missing count');
		});
	});
});

function createConfigArrayResult(): TResultArray<{ url: string }, string> {
	return [false, 'Missing config', undefined];
}
