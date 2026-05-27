<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/validatenv/.github/banner.svg" alt="validatenv banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/validatenv">
        <img src="https://img.shields.io/bundlephobia/minzip/validatenv.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/validatenv">
        <img src="https://img.shields.io/npm/dt/validatenv.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`validatenv` turns environment variables into typed config before your app starts. It validates with Standard Schema validators, reports every invalid variable in one error, and works with any env-like object.

- Use Zod, Valibot, ArkType, or built-in validators without adapter packages
- Infer transformed output types: `z.string().transform(Number)` returns `number`
- Cover common env shapes: boolean, number, port, URL, host, email, JSON
- Clean raw env values with `preprocess` when a value needs small input cleanup
- Share one spec style across Node.js, Bun, Deno, and Vite defines

```ts
import { booleanValidator, portValidator, validateEnv } from 'validatenv';
import * as z from 'zod';

const env = validateEnv(process.env, {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  PORT: portValidator, // number, validated 1-65535, no Zod required
  DEBUG: booleanValidator // parses "true", "yes", "1", "on" and their opposites
});

// env.NODE_ENV is 'development' | 'production' | 'test'
// env.PORT is number, inferred from the validator
// env.DEBUG is boolean, inferred from the validator
```

Migrating from `0.0.x`? See [MIGRATION.md](./MIGRATION.md).

## Install

```bash
npm install validatenv
```

Examples use Zod, but any Standard Schema validator works:

```bash
npm install zod
```

## Usage

Pick the helper that matches the config shape:

- `validateEnv`: validate a full env spec into one typed config object
- `validateEnvVar`: validate one variable outside a full spec
- `createEnv`: split server, client, and shared specs with client-side access guards
- `createViteEnvDefine`: create Vite `define` values from validated env variables

`validateEnv` reads a spec object where each key maps to a validator. The object key is the environment variable name by default, and validation throws synchronously if any variable is missing or invalid:

```ts
import { booleanValidator, portValidator, validateEnv } from 'validatenv';
import * as z from 'zod';

const env = validateEnv(process.env, {
  PORT: portValidator,
  DEBUG: booleanValidator,
  API_URL: z.string().url()
});
```

Use an object spec when the env key differs from the output key, or when you need a default, raw cleanup, a description, or an example shown in error messages:

```ts
const env = validateEnv(process.env, {
  dbUrl: {
    envKey: 'DATABASE_URL',
    validator: z.string().url(),
    description: 'Postgres connection URL',
    example: 'postgres://user:password@localhost:5432/app'
  }
});
```

Pass any [Standard Schema](https://github.com/standard-schema/standard-schema) compatible validator directly: no adapter needed.

```ts
import * as v from 'valibot';

const env = validateEnv(process.env, {
  APP_NAME: v.string()
});
```

## API

### `validateEnv(env, specs)`

Validates all variables in `specs` against `env` and returns a typed object. Throws synchronously if any variable fails, listing every failed variable and its issue in a single error message.

```ts
const env = validateEnv(process.env, {
  PORT: portValidator,
  DATABASE_URL: z.string().url()
});
```

Each spec entry can be a validator directly, an object spec, or a static config value copied into the output without validation. Object specs support these fields:

| Field          | Required | Description                                                       |
| -------------- | -------- | ----------------------------------------------------------------- |
| `validator`    | yes      | Any Standard Schema compatible validator or built-in validator    |
| `envKey`       | no       | Override the environment variable name (defaults to the spec key) |
| `preprocess`   | no       | Clean the raw value before defaults and validation run            |
| `defaultValue` | no       | Static value or default helper function applied before validation |
| `description`  | no       | Human-readable description shown in error messages                |
| `example`      | no       | Example value shown in error messages                             |

### `validateEnvVar(source, key, validatorOrSpec)`

Validates a single environment variable. Use this when you need to validate one value outside of a full spec:

```ts
import { portValidator, validateEnvVar } from 'validatenv';

const port = validateEnvVar(process.env, 'PORT', portValidator);
```

Pass the source explicitly so the same helper works in Node.js, Bun, Deno, Vite, and tests.

### `createEnv(options)`

Validates grouped server, client, and shared specs. On the client, server specs are not validated, but reading a server-only key throws:

```ts
import { createEnv, urlValidator } from 'validatenv';

const env = createEnv({
  env: process.env,
  isServer: typeof window === 'undefined',
  server: {
    DATABASE_URL: urlValidator
  },
  client: {
    NEXT_PUBLIC_API_URL: urlValidator
  },
  shared: {
    APP_VERSION: '1.2.3'
  }
});
```

This helper is useful when you want one typed env object with a runtime access guard. It does not stop bundlers from including imported schema code or variable names in client bundles. Use separate server and client modules when those names are sensitive.

Access is guarded by the returned output key. For example, `{ dbUrl: { envKey: 'DATABASE_URL', validator } }` blocks `env.dbUrl` in client mode.

Server, client, and shared output keys must be unique. Pass `onInvalidAccess` to customize the error thrown when client code reads a server-only key.

## Validators

Built-in validators implement the Standard Schema interface and require no schema library:

| Validator          | Output    | Description                                                              |
| ------------------ | --------- | ------------------------------------------------------------------------ |
| `stringValidator`  | `string`  | Requires a string value                                                  |
| `booleanValidator` | `boolean` | Parses `true`, `t`, `yes`, `on`, `1`, and `false`, `f`, `no`, `off`, `0` |
| `numberValidator`  | `number`  | Parses finite numbers                                                    |
| `portValidator`    | `number`  | Parses integer ports from `1` to `65535`                                 |
| `emailValidator`   | `string`  | Checks a practical email shape                                           |
| `hostValidator`    | `string`  | Accepts fully qualified domains or IP addresses                          |
| `urlValidator`     | `string`  | Requires a valid URL                                                     |
| `jsonValidator`    | `unknown` | Parses JSON strings and returns the parsed value                         |

Schema transforms are supported. The inferred type follows the output of the transform:

```ts
const env = validateEnv(process.env, {
  PORT: z.string().transform(Number)
});

env.PORT; // number
```

When a schema transforms its input, the default should match the schema input type, not the output type:

```ts
const env = validateEnv(process.env, {
  PORT: {
    validator: z.string().transform(Number),
    defaultValue: '3000' // string input, number output
  }
});

env.PORT; // number
```

## Preprocess

Use `preprocess` for small raw-value cleanup before defaults and validation run. Keep parsing and transforms in the validator whenever possible:

```ts
import {
  emptyStringAsUndefined,
  pipePreprocess,
  stringValidator,
  stripTrailingSlash,
  urlValidator,
  validateEnv
} from 'validatenv';

const env = validateEnv(process.env, {
  API_KEY: {
    validator: stringValidator,
    preprocess: emptyStringAsUndefined,
    defaultValue: 'local-api-key'
  },
  API_URL: {
    validator: urlValidator,
    preprocess: pipePreprocess(emptyStringAsUndefined, stripTrailingSlash),
    defaultValue: 'http://localhost:3000'
  }
});
```

Included helpers:

| Helper                   | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `emptyStringAsUndefined` | Treats blank strings and nullish values like missing values |
| `stripTrailingSlash`     | Removes one trailing slash from string values               |
| `pipePreprocess`         | Combines preprocess helpers into one `preprocess` function  |

The included preprocess helpers expect string env values. They return `undefined` for nullish values and throw for other non-string values.

## Defaults

Default helpers supply a fallback value after preprocessing and before validation. Pass a static value or one of the built-in helpers as `defaultValue`:

```ts
import {
  devDefault,
  localDefault,
  pipeDefaults,
  portValidator,
  testDefault,
  urlValidator,
  validateEnv
} from 'validatenv';

const env = validateEnv(process.env, {
  PORT: {
    validator: portValidator,
    defaultValue: devDefault(3000) // only active when NODE_ENV=development
  },
  API_URL: {
    validator: urlValidator,
    defaultValue: pipeDefaults(
      localDefault('http://localhost:3000'), // NODE_ENV=local or development
      testDefault('http://localhost:3000') // NODE_ENV=test
    )
  }
});
```

Available helpers:

| Helper         | Active when                                                    |
| -------------- | -------------------------------------------------------------- |
| `devDefault`   | `NODE_ENV` is `development`                                    |
| `localDefault` | `NODE_ENV` is `local` or `development`                         |
| `testDefault`  | `NODE_ENV` is `test`                                           |
| `ciDefault`    | `CI` is truthy                                                 |
| `envDefault`   | `NODE_ENV` matches values you provide                          |
| `pipeDefaults` | tries each helper in order, returns first non-undefined result |

Returning `undefined` from a default function means the value stays undefined. Required variables still fail unless another default supplies a value.

## Vite

### `createViteEnvDefine(env, specs)`

Validates the spec against `env` and returns a Vite-compatible `define` object. Use this in `vite.config.ts` to validate and inject values into the client bundle:

```ts
import { createViteEnvDefine, stringValidator, urlValidator } from 'validatenv';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), '')
  };

  return {
    define: createViteEnvDefine(env, {
      PACKAGE_VERSION: {
        envKey: 'npm_package_version',
        validator: stringValidator,
        defaultValue: '0.0.0'
      },
      VITE_API_URL: urlValidator
    })
  };
});
```

The helper returns Vite-compatible replacement expressions:

```ts
{
  'import.meta.env.PACKAGE_VERSION': '"0.0.0"',
  'import.meta.env.VITE_API_URL': '"https://api.example.com"'
}
```

Values are emitted as JavaScript replacement expressions: strings are quoted, numbers and booleans are literals, `undefined` is emitted as `undefined`, and non-serializable values throw.

Only keys listed in the spec are injected. Keep server-only values out of this spec.

## FAQ

### How does it compare to envalid, t3-env, and dotenv-safe?

`validatenv` focuses on Standard Schema compatibility and runtime portability. Use it when you want to validate any env-like object with Zod, Valibot, ArkType, or built-in validators without tying the API to a specific framework.

- [envalid](https://github.com/af/envalid): env validation with built-in validators and a custom validator API
- [t3-env](https://github.com/t3-oss/t3-env): type-safe env validation with Zod, designed around Next.js and tRPC
- [dotenv-safe](https://github.com/rolodato/dotenv-safe): checks that required env keys are present

### When should I use `validateEnv` or `createEnv`?

Use `validateEnv` when you want the smallest primitive: pass one env-like source and one spec, then get validated typed config back. It is the best default for scripts, CLIs, server-only apps, Vite config, and separate server/client modules.

Use `createEnv` when you want one app-level env object split into `server`, `client`, and `shared` specs. It validates only client-safe specs in client mode and throws if server-only output keys are read there. This is a DX guard, not a bundler security boundary.

### When should I use `preprocess` instead of a schema transform?

Use `preprocess` for raw env cleanup that should happen before defaults, such as treating empty strings like missing values:

```ts
const env = validateEnv(process.env, {
  API_URL: {
    validator: urlValidator,
    preprocess: emptyStringAsUndefined,
    defaultValue: 'http://localhost:3000'
  }
});
```

Use schema transforms for parsing and semantic normalization, such as string-to-number, string-to-boolean, JSON parsing, or app-specific output shapes:

```ts
const env = validateEnv(process.env, {
  PORT: z.string().transform(Number)
});
```

In short: `preprocess` cleans raw input so defaults and validators receive the right value; the validator decides the final typed output.

### Can I put static values in the spec?

Yes. Top-level raw values are copied into the validated output as static config values. Use this for constants that are already known in code:

```ts
const env = validateEnv(process.env, {
  DATABASE_URL: z.string().url(),
  PACKAGE_VERSION: '1.2.3'
});
```

Static entries are not validated. If a value should still pass through a validator, put it into the source object or use `defaultValue` with an object spec.

### Does it read `.env` files?

No. Load env files with `dotenv` or your runtime's built-in mechanism before calling `validateEnv`.

### How do I make a variable optional?

Use `defaultValue` to supply a fallback when the variable is absent. If no fallback makes sense, use a validator that accepts `undefined`:

```ts
const env = validateEnv(process.env, {
  // Falls back to 3000 when PORT is not set
  PORT: {
    validator: portValidator,
    defaultValue: 3000
  },
  // Absent value passes through as undefined
  SENTRY_DSN: z.string().url().optional()
});

// env.PORT is number
// env.SENTRY_DSN is string | undefined
```

If your runtime leaves missing values as empty strings, use `preprocess: emptyStringAsUndefined` before an optional validator or default.

### Can I use it without Zod or Valibot?

Yes. The built-in validators cover the most common patterns: string, boolean, number, port, URL, email, host, and JSON. No schema library is required.

### What happens when validation fails?

`validateEnv` throws synchronously with a single error message that lists every failed variable and its issue. If uncaught during startup, the process stops before the app starts serving traffic.

```
Environment validation failed:

Invalid value for DATABASE_URL
Description: Postgres connection URL
Example: postgres://user:password@localhost:5432/app
Error: Must be a valid URL

Invalid value for PORT
Error: Must be a valid port number (1-65535)
```

`description` and `example` fields on the spec object are included in the error when set.

### Does it support async validators?

No. Env validation is synchronous by design so startup failure is immediate and deterministic.

### Can I use it in Bun or Deno?

Yes. `validateEnv` accepts any `Record<string, unknown>` as the env source. Pass `process.env` in Node.js and Bun, or `Deno.env.toObject()` in Deno.

### How do I separate server and client env?

Validate each source in its own module and import only what each side needs:

```ts
// server/env.ts
export const env = validateEnv(process.env, {
  DATABASE_URL: z.string().url()
});

// client/env.ts
export const publicEnv = validateEnv(import.meta.env, {
  VITE_API_URL: z.string().url()
});
```

`validatenv` does not enforce this boundary automatically. If server variable names are sensitive, keep server and client schemas in separate files so the client bundle never imports the server schema.
