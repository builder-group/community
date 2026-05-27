# Vitest Rules

Write tests so they read like small specifications.

## Enforce

- Place tests next to the source file they cover
- Use `.test.ts`, `.test.tsx`, or `.test-d.ts` for type tests
- Group tests with `describe`
- Use one top-level `describe` for the unit under test
- Add nested `describe` blocks only for public members or meaningful behavior categories
- Include the subject kind in concrete `describe` names, such as `createForm function`, `FlatQueue class`, `listen method`, or `value property`
- Omit the subject kind from category `describe` names, such as `types`, `validation`, or `dirty tracking`
- Start `it(...)` descriptions with `should`
- Keep each test focused on one behavior
- Prefer 80/20 coverage by default: cover the core contract, important edge cases, and regressions without exhaustive case matrices unless explicitly requested
- Use Prepare / Act / Assert structure when the test has more than a couple of steps
- Use `async` / `await` for async tests
- Cover both success and error paths where behavior matters

## Avoid

- Do not mix many behaviors into one test
- Do not rely on implicit promises or `.then(...)` chains in tests
- Do not hide setup inside vague helper names
- Do not use unclear test names like `works` or `test x`
- Do not add a kind suffix to category describes that are not testing a concrete package, function, class, method, or property

## Examples

### Good

```ts
describe('createStore function', () => {
  describe('types', () => {
    it('should infer value types', () => {
      const store = createStore('value');

      expectTypeOf(store.get()).toEqualTypeOf<string>();
    });
  });

  describe('set method', () => {
    it('should notify listeners when the value changes', () => {
      // Prepare
      const store = createStore(0);
      const listener = vi.fn();
      store.listen(listener);

      // Act
      store.set(1);

      // Assert
      expect(listener).toHaveBeenCalledWith({ value: 1 });
    });
  });
});
```

### Avoid

```ts
describe('store', () => {
  describe('set method edge cases and notification behavior', () => {
    it('works', () => {
      const store = createStore(0);
      const listener = vi.fn();
      store.listen(listener);
      store.set(1);
      store.set(1);
      expect(store.get()).toBe(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
```
