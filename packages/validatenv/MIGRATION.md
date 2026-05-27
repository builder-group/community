# Migration Guide

## 0.0.x to 0.1.0

`validatenv` now validates with Standard Schema-compatible validators directly. The package still turns environment variables into typed config objects, but validator wrappers, middleware, defaults, and single-variable validation changed.

### Use Standard Schema Validators Directly

Old validators based on `validation-adapter` no longer match the public API.

Pass Standard Schema-compatible schemas directly:

```ts
import { validateEnv } from 'validatenv';
import { z } from 'zod';

const env = validateEnv(process.env, {
  PORT: z.coerce.number().int().min(1).max(65535),
  API_KEY: z.string().min(10)
});
```

Built-in validators still exist, but they now expose Standard Schema behavior through `~standard.validate`.

Custom validators must be Standard Schema-compatible. Old `.validate(context)` validators should be rewritten.

### Replace Middlewares With Preprocess Functions

The `middlewares` export path was removed. `booleanMiddleware`, `numberMiddleware`, and `nonEmptyStringMiddleware` were removed.

Use validators for parsing and `preprocess` for raw cleanup:

```ts
import {
  emptyStringAsUndefined,
  pipePreprocess,
  stripTrailingSlash,
  validateEnv
} from 'validatenv';
import { z } from 'zod';

const env = validateEnv(process.env, {
  API_URL: {
    validator: z.string().url(),
    preprocess: pipePreprocess(emptyStringAsUndefined, stripTrailingSlash)
  }
});
```

Object specs now use singular `preprocess?: fn`, not `middlewares?: fn[]`.

### Remove `value` Overrides

The old object-spec `value` override was removed. Specs now read from `env[envKey]`.

Use `envKey` to read a different environment key, or use `defaultValue` when a value should come from code:

```ts
const env = validateEnv(process.env, {
  PUBLIC_API_URL: {
    envKey: 'API_URL',
    validator: z.string().url()
  },
  NODE_ENV: {
    validator: z.enum(['development', 'test', 'production']),
    defaultValue: () => 'development'
  }
});
```

### Update `validateEnvVar`

The single-variable helper now takes the env object first.

```ts
// old
validateEnvVar('API_KEY', spec, process.env);

// new
validateEnvVar(process.env, 'API_KEY', z.string().min(10));
```

You can also pass a spec object:

```ts
validateEnvVar(process.env, {
  envKey: 'API_KEY',
  validator: z.string().min(10)
});
```

### Rename Default Helpers

`combineDefaults` was renamed to `pipeDefaults`.

`pipeDefaults` requires at least one default function:

```ts
import { pipeDefaults } from 'validatenv';

const defaultValue = pipeDefaults(
  () => process.env.FALLBACK_PORT,
  () => '3000'
);
```

### Update Types

Removed or renamed types:

| Old type          | New type                 |
| ----------------- | ------------------------ |
| `TEnvMiddleware`  | `TEnvPreprocess`         |
| `TDefaultValueFn` | `TEnvDefaultFn`          |
| `TEnvSpecValue`   | Use `TEnvSpec` inference |

`TEnvSpec` is now generic over input and output. Defaults and preprocess functions must match the validator input, while output inference follows the schema output.

### Review Error Behavior

Async validators are rejected. Use synchronous Standard Schema validators.

Thrown validator, preprocess, and default errors are formatted and collected. Standard Schema issue paths may now appear in error messages.

### New Helpers

The release adds:

- `createEnv`
- `createViteEnvDefine`
- `pipePreprocess`
- `emptyStringAsUndefined`
- `stripTrailingSlash`
