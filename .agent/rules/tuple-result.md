# Tuple Result Rules

Use `tuple-result` as the default Result pattern when working with repo code that returns results.

## Enforce

- Prefer array destructuring for new and touched application code: `[isThingOk, thingErr, thing]`
- Name the tuple variables from the domain value:
  - `isUserOk`, `userErr`, `user`
  - `isConfigOk`, `configErr`, `config`
- Treat the first slot as the primary branch condition
- Handle the error branch explicitly before using the value
- Use `Ok(...)` and `Err(...)` to construct results
- Use helpers like `mapOk`, `mapErr`, `match`, `unwrapOr`, and `tAsync` when they make the code simpler

## Avoid

- Do not use generic tuple names like `ok`, `err`, and `value` when a domain name is available
- Do not ignore the error slot when destructuring
- Do not unwrap eagerly when normal branching keeps control flow clearer
- Do not churn unrelated old code only to migrate result style
- Do not mix many result-handling styles in the same module without a reason

## Example

```ts
const configResult = await loadConfig();
const [isConfigOk, configErr, config] = configResult;
if (!isConfigOk) {
	throw new AppError('Failed to load config', { cause: configErr });
}

return config;
```
