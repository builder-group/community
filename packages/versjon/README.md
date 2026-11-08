<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/versjon/.github/banner.svg" alt="versjon banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/versjon">
        <img src="https://img.shields.io/bundlephobia/minzip/versjon.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/versjon">
        <img src="https://img.shields.io/npm/dt/versjon.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`versjon` validates versioned JSON objects and migrates older values to a current shape. It uses `$schema` as a `<family>@<version>` tag, such as `note@1`. A definition pairs the current validator with any migrations needed to read older versions.

- Infer the current value type from a [Standard Schema](https://github.com/standard-schema/standard-schema) validator
- Validate stored values before running migrations
- Check every migration output against the next version
- Route values from different families through a registry
- Return detached JSON values without changing caller input

```ts
import { defineSchema, prepareSchemaValue } from 'versjon';
import { z } from 'zod';

const noteDefinition = defineSchema({
  family: 'note',
  version: 1,
  schema: z.strictObject({
    $schema: z.literal('note@1'),
    title: z.string()
  })
});

const storedValue: unknown = { $schema: 'note@1', title: 'Hello' };
const [isNoteOk, noteErr, note] = prepareSchemaValue(noteDefinition, storedValue);

if (!isNoteOk) throw noteErr;
note.title; // string
```

## Install

```bash
npm install versjon
```

The examples use Zod. Install it separately, or use another synchronous Standard Schema validator:

```bash
npm install zod
```

## Usage

Use a definition when the value's family is known. Add migrations as its shape changes, or use a registry when input may belong to several families.

### Migrations

Add a migration when the current shape changes. The migration reads a validated version 1 value and produces version 2:

```ts
import { defineMigration } from 'versjon';

const currentNoteDefinition = defineSchema({
  family: 'note',
  version: 2,
  schema: z.strictObject({
    $schema: z.literal('note@2'),
    heading: z.string()
  }),
  migrations: {
    1: defineMigration({
      schema: noteDefinition.schema,
      migrate(value) {
        return { $schema: 'note@2' as const, heading: value.title };
      }
    })
  }
});

const [isPreparedOk, prepareErr, preparedNote] = prepareSchemaValue(
  currentNoteDefinition,
  storedValue
);
if (!isPreparedOk) throw prepareErr;

preparedNote.heading; // string
```

### Validate the current version

Use `validateSchemaValue()` to reject older versions without running migrations:

```ts
import { validateSchemaValue } from 'versjon';

const [isCurrentOk, currentErr, currentNote] = validateSchemaValue(currentNoteDefinition, {
  $schema: 'note@2',
  heading: 'Hello'
});
if (!isCurrentOk) throw currentErr;

currentNote.heading; // string
```

This rejects `note@1` because the definition's current version is `note@2`.

### Registries

Use a registry when `$schema` determines the family. It validates and migrates the selected value:

```ts
import {
  createSchemaRegistry,
  prepareSchemaValueFromRegistry,
  validateSchemaValueFromRegistry
} from 'versjon';

const taskDefinition = defineSchema({
  family: 'task',
  version: 1,
  schema: z.strictObject({
    $schema: z.literal('task@1'),
    done: z.boolean()
  })
});

const registry = createSchemaRegistry([currentNoteDefinition, taskDefinition]);
const [isValueOk, valueErr, value] = prepareSchemaValueFromRegistry(registry, storedValue);
if (!isValueOk) throw valueErr;

if (value.$schema === 'note@2') {
  value.heading; // string
}
```

To require the current version without migrating, validate through the same registry:

```ts
const [isCurrentOk, currentErr, currentValue] = validateSchemaValueFromRegistry(registry, {
  $schema: 'task@1',
  done: false
});
if (!isCurrentOk) throw currentErr;
```

This accepts `task@1`, the registered current version. It rejects `note@1` because `note@2` is current.

## API

### `defineSchema(definition)`

Defines the current validator and supported migrations for one family. TypeScript checks that the current validator's output type uses `<family>@<version>` as its `$schema` reference.

| Field        | Required | Description                                                 |
| ------------ | -------- | ----------------------------------------------------------- |
| `family`     | yes      | Nonempty name without `@`                                   |
| `version`    | yes      | Current version as a positive safe integer                  |
| `schema`     | yes      | Synchronous Standard Schema validator for the current value |
| `migrations` | no       | Migrations keyed by the version they read                   |

Each migration key names the version it reads. For example, key `1` migrates version `1` to version `2`. Keys must form a continuous path from the earliest supported version to the current version. A definition without migrations accepts only its current version. Invalid families, versions, or migration chains throw `VersjonError` when the definition is created.

### `validateSchemaDefinition(definition)`

Checks a definition's family, version and migration chain. The result contains `VersjonError` when the definition is invalid.

### `defineMigration(migration)`

Preserves the source validator's output type as the `migrate()` input type. A migration may change the data shape. Its output must use the next `$schema` version and pass that version's validator.

### `prepareSchemaValue(definition, input)`

Validates an unknown value and migrates supported older versions to the definition's current version. A current value is validated without migration. The result contains a detached value with the current schema's inferred type or `VersjonError`.

### `validateSchemaValue(definition, input)`

Validates an unknown value against the definition's current version without running migrations. The value's `$schema` must match the definition's family and version. The result contains a detached value with the schema's inferred type or `VersjonError`.

### `createSchemaRegistry(definitions)`

Creates a registry of schema definitions keyed by family. Duplicate families throw `VersjonError`.

### `prepareSchemaValueFromRegistry(registry, input)`

Selects a definition from the input's `$schema`, validates the value and migrates it to that family's current version.

### `validateSchemaValueFromRegistry(registry, input)`

Selects a definition from the input's `$schema` family and validates the value against its current version. It rejects older versions without running migrations.

## References and JSON values

References use `<family>@<version>`. Versions are positive safe integers without leading zeroes. These helpers are available when you need to inspect or create references directly:

| Helper                    | Behavior                                                 |
| ------------------------- | -------------------------------------------------------- |
| `parseSchemaReference()`  | Parse a string into a family and numeric version         |
| `readSchemaReference()`   | Read and parse `$schema` from a JSON object              |
| `formatSchemaReference()` | Join a family and version without validating either part |

The JSON helpers support the same value rules used by schema validation:

| Helper                 | Behavior                                                        |
| ---------------------- | --------------------------------------------------------------- |
| `isJsonValue()`        | Check an unknown value against the runtime JSON constraints     |
| `isJsonObject()`       | Check that a value is a JSON object                             |
| `cloneJson()`          | Copy a validated JSON value without shared nested references    |
| `areJsonValuesEqual()` | Compare validated JSON values without relying on property order |

Values may contain finite numbers, strings, booleans, `null`, plain objects and dense arrays. Objects with a null prototype are accepted. Cycles, sparse arrays, extra enumerable string properties on arrays and object or array nesting deeper than 100 levels are rejected. Use `isJsonValue()` before passing unknown values to `cloneJson()`.

## Errors

Validation, preparation and reference parsing report `VersjonError` through `tuple-result`. `defineSchema()` and `createSchemaRegistry()` throw for invalid setup.

| Code                     | Meaning                                              |
| ------------------------ | ---------------------------------------------------- |
| `#ERR_SCHEMA_DEFINITION` | Invalid family, version, or migration chain          |
| `#ERR_SCHEMA_REFERENCE`  | Missing, malformed, unknown, or unexpected reference |
| `#ERR_SCHEMA_VALUE`      | Invalid JSON value or failed schema validation       |
| `#ERR_SCHEMA_MIGRATION`  | Missing, failed, or invalid migration                |
| `#ERR_SCHEMA_REGISTRY`   | Duplicate family in a registry                       |

`VersjonError` exposes `code` and may include the validator issues or original failure in `cause`.

## FAQ

### How does it compare to plain Zod or Valibot schemas and Cambria?

`versjon` adds versioning on top of a validator. Use it when stored JSON outlives the code that wrote it and every reader needs the current shape.

- [Zod](https://github.com/colinhacks/zod) and [Valibot](https://github.com/fabian-hiller/valibot): validate one shape. `versjon` uses them as the validator for each version and adds the `$schema` tag, migration chain, and registry
- [Cambria](https://github.com/inkandswitch/cambria): translates JSON between versions with bidirectional lenses. `versjon` migrates forward only, with plain functions checked by the next version's validator

### Can a validator transform or add defaults?

A validator must return a JSON object structurally equal to the input. Transforms, defaults, or property stripping fail when they change that value. Put intentional shape changes in migrations.

### Are asynchronous validators or migrations supported?

No. `versjon` rejects a validator that returns a promise. Migration callbacks are synchronous.

### Do migrations need to start at version `1`?

No. The first migration key sets the earliest supported version. From that key onward, every version needs a migration until the current version. Older values without a migration are rejected.
