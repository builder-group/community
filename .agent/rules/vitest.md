# Vitest Rules

Write tests so they read like small specifications.

## Enforce

- Place tests next to the source file they cover
- Use `.test.ts` or `.test.tsx`
- Group tests with `describe`
- Start `it(...)` descriptions with `should`
- Keep each test focused on one behavior
- Use Prepare / Act / Assert structure when the test has more than a couple of steps
- Use `async` / `await` for async tests
- Cover both success and error paths where behavior matters

## Avoid

- Do not mix many behaviors into one test
- Do not rely on implicit promises or `.then(...)` chains in tests
- Do not hide setup inside vague helper names
- Do not use unclear test names like `works` or `test x`

## Example

```ts
describe('parseInput', () => {
	it('should parse valid JSON', () => {
		// Prepare
		const input = '{"key":"value"}';

		// Act
		const result = parseInput(input);

		// Assert
		expect(result).toEqual({ key: 'value' });
	});
});
```
