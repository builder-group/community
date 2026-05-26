<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/config/.github/banner.svg" alt="@blgc/config banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@blgc/config">
        <img src="https://img.shields.io/npm/dt/@blgc/config.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`@blgc/config` packages Builder Group's shared TypeScript, ESLint, Prettier, and Vitest config. It gives packages the same strict defaults, import ordering, generated-file ignores, and test setup without copying config files between repos.

- Share one Prettier config with import sorting, Tailwind class sorting, CSS ordering, and package.json sorting
- Use flat ESLint configs for libraries, React, Next.js, and TanStack projects
- Extend TypeScript configs for libraries, DOM libraries, Node 20, React, Next.js, and TanStack
- Reuse a Vitest node config with TypeScript path resolution and coverage defaults

```js
// eslint.config.js
module.exports = [
  ...require('@blgc/config/eslint/library'),
  {
    rules: {
      // project-specific overrides
    }
  }
];
```

```js
// eslint.config.mjs
import libraryConfig from '@blgc/config/eslint/library';

export default [
  ...libraryConfig,
  {
    rules: {
      // project-specific overrides
    }
  }
];
```

```json
{
  "prettier": "@blgc/config/prettier"
}
```

## Install

```bash
npm install -D @blgc/config eslint prettier typescript
```

Install the tools you use in the project. Add `vitest` directly when you use the shared Vitest config because it imports `vitest/config` and your scripts still run the Vitest CLI.

## Usage

Use the config entry that matches the tool you are setting up:

- `@blgc/config/prettier`: shared Prettier rules and sorting plugins
- `@blgc/config/eslint/base`: shared ESLint foundation for custom presets
- `@blgc/config/eslint/library`: flat ESLint config for TypeScript libraries
- `@blgc/config/eslint/react-internal`: flat ESLint config for internal React packages
- `@blgc/config/eslint/next`: flat ESLint config for Next.js apps
- `@blgc/config/eslint/tanstack`: flat ESLint config for TanStack apps
- `@blgc/config/typescript/library`: TypeScript config for Node-targeted libraries
- `@blgc/config/typescript/library-dom`: TypeScript config for DOM-capable libraries
- `@blgc/config/typescript/node20`: TypeScript config for Node 20 projects
- `@blgc/config/typescript/react-internal`: TypeScript config for internal React packages
- `@blgc/config/typescript/next`: TypeScript config for Next.js apps
- `@blgc/config/typescript/tanstack`: TypeScript config for TanStack apps
- `@blgc/config/vite/node`: Vitest config for Node test environments

## Prettier

Reference the shared config from `package.json`:

```json
{
  "prettier": "@blgc/config/prettier"
}
```

The Prettier config includes:

- tabs for code files, two-space indentation for Markdown, single quotes, semicolons, and `printWidth: 100`
- sorted imports through `@ianvs/prettier-plugin-sort-imports`
- Tailwind class sorting through `prettier-plugin-tailwindcss`
- CSS declaration ordering through `prettier-plugin-css-order`
- package.json ordering through `prettier-plugin-packagejson`

## ESLint

Use flat config from `eslint.config.js`:

```js
// CommonJS
module.exports = [
  ...require('@blgc/config/eslint/library'),
  {
    rules: {
      // local overrides
    }
  }
];
```

```js
// ESM
import libraryConfig from '@blgc/config/eslint/library';

export default [
  ...libraryConfig,
  {
    rules: {
      // local overrides
    }
  }
];
```

Choose the preset by project type:

| Preset                               | Use for                       |
| ------------------------------------ | ----------------------------- |
| `@blgc/config/eslint/library`        | TypeScript packages           |
| `@blgc/config/eslint/react-internal` | React packages and Vite apps  |
| `@blgc/config/eslint/next`           | Next.js apps                  |
| `@blgc/config/eslint/tanstack`       | TanStack Router or Start apps |

The base config includes recommended JavaScript rules, TypeScript strict rules, Prettier compatibility, Turbo env-var warnings, `only-warn`, and generated-file ignores.

`only-warn` makes ESLint report rule failures as warnings. Use `eslint --max-warnings=0` in CI when warnings should fail the build.

## TypeScript

Extend the closest TypeScript config:

```json
{
  "extends": "@blgc/config/typescript/library",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declarationDir": "./dist/types"
  },
  "include": ["src"]
}
```

Available configs:

| Config                                   | Use for                               |
| ---------------------------------------- | ------------------------------------- |
| `@blgc/config/typescript/base`           | Shared strict base settings           |
| `@blgc/config/typescript/library`        | TypeScript libraries without DOM APIs |
| `@blgc/config/typescript/library-dom`    | Libraries that use DOM globals        |
| `@blgc/config/typescript/node20`         | Node 20 packages and tools            |
| `@blgc/config/typescript/react-internal` | React packages and Vite apps          |
| `@blgc/config/typescript/next`           | Next.js apps                          |
| `@blgc/config/typescript/tanstack`       | TanStack apps                         |

Defaults to know: the base configs enable declarations and declaration maps, use `skipLibCheck`, and leave TypeScript unused checks off. The library presets allow JavaScript files. `@blgc/config/typescript/library` uses CommonJS output, so override `compilerOptions.module` when a project needs TypeScript to emit ESM directly.

## Vitest

Merge the shared Vite/Vitest node config when you want the default test setup:

```js
import { nodeConfig } from '@blgc/config/vite/node';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nodeConfig,
  defineConfig({
    test: {
      // project-specific test options
    }
  })
);
```

The node config enables TypeScript path resolution and coverage reporters for text, JSON, and HTML.

## FAQ

### Do I need every peer tool installed?

No. Install the tools that your project runs. For example, a package that only extends TypeScript config does not need to run ESLint or Prettier.

### Can I override rules?

Yes. Add another config object after the shared config in `eslint.config.js`, add `compilerOptions` in `tsconfig.json`, or pass project-specific options to `mergeConfig` for Vitest.

### Why keep these configs in a package?

A package keeps defaults versioned, reviewable, and reusable. Projects can update one dependency instead of copying config changes by hand.

## Credits

- [`turbo-basic`](https://github.com/vercel/turbo/tree/main/examples/basic): base configuration patterns from Vercel's starter template
- [`tsconfig/bases`](https://github.com/tsconfig/bases): TypeScript configuration references
