import { Err, isOk, match, Ok, t, tAsync, unwrapOr, type TResult } from 'tuple-result';

// Basic Ok/Err creation and destructuring
function basicExample(): void {
	const success = Ok<number, string>(42);
	const failure = Err<number, string>('Something went wrong');

	// Destructure as array: [ok, error, value]
	const [ok1, _err1, value1] = success;
	console.log('Success:', { ok: ok1, value: value1 });

	const [ok2, err2] = failure;
	console.log('Failure:', { ok: ok2, error: err2 });
}

// Function that returns a Result
function divide(a: number, b: number): TResult<number, string> {
	if (b === 0) {
		return Err('Division by zero');
	}
	return Ok(a / b);
}

// Using type guards and unwrap helpers
function typeGuardsExample(): void {
	const result = divide(10, 2);

	if (isOk(result)) {
		console.log('Division result:', result.value);
	}

	// Using unwrapOr for default values
	const safeResult = unwrapOr(divide(10, 0), 0);
	console.log('Safe division (with default):', safeResult);
}

// Pattern matching
function matchExample(): void {
	const result = divide(10, 3);

	const message = match(result, {
		ok: (value) => `Result: ${value.toFixed(2)}`,
		err: (error) => `Error: ${error}`
	});

	console.log(message);
}

// Wrapping functions with t() and tAsync()
function wrapperExample(): void {
	// Wrap a function that might throw
	const parsed = t(JSON.parse, '{"name": "test"}');
	const [ok, _err, value] = parsed;
	console.log('Parsed JSON:', { ok, value });

	// Wrap invalid JSON
	const invalid = t(JSON.parse, 'not json');
	console.log('Invalid JSON:', { ok: invalid[0], error: invalid[1] });
}

async function asyncExample(): Promise<void> {
	// Wrap a promise
	const result = await tAsync(Promise.resolve('async value'));
	console.log('Async result:', { ok: result[0], value: result[2] });

	// Wrap a rejected promise
	const rejected = await tAsync(Promise.reject(new Error('async error')));
	console.log('Rejected:', { ok: rejected[0], error: rejected[1] });
}

// Run examples
console.log('--- Basic Example ---');
basicExample();

console.log('\n--- Type Guards Example ---');
typeGuardsExample();

console.log('\n--- Match Example ---');
matchExample();

console.log('\n--- Wrapper Example ---');
wrapperExample();

console.log('\n--- Async Example ---');
asyncExample();
