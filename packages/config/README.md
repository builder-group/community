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
- `@blgc/config/eslint/react`: flat ESLint config for React packages and apps
- `@blgc/config/eslint/next`: flat ESLint config for Next.js apps
- `@blgc/config/eslint/tanstack`: flat ESLint config for TanStack apps
- `@blgc/config/typescript/library`: TypeScript config for bundled libraries without DOM APIs
- `@blgc/config/typescript/library-dom`: TypeScript config for DOM-capable libraries
- `@blgc/config/typescript/node20`: TypeScript config for Node 20 projects
- `@blgc/config/typescript/react`: TypeScript config for React packages and apps
- `@blgc/config/typescript/next`: TypeScript config for Next.js apps
- `@blgc/config/typescript/tanstack`: TypeScript config for TanStack apps
- `@blgc/config/vitest/node`: Vitest config for Node test environments

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

Projects that need a Tailwind v4 stylesheet path or Tailwind v3 config path should extend this config and set `tailwindStylesheet` or `tailwindConfig` locally.

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

| Preset                         | Use for                       |
| ------------------------------ | ----------------------------- |
| `@blgc/config/eslint/library`  | TypeScript packages           |
| `@blgc/config/eslint/react`    | React packages and Vite apps  |
| `@blgc/config/eslint/next`     | Next.js apps                  |
| `@blgc/config/eslint/tanstack` | TanStack Router or Start apps |

The base config includes recommended JavaScript rules, TypeScript strict rules, Prettier compatibility, warning-only lint reporting, Turbo env-var warnings, unused disable reporting, and general generated/build artifact ignores. Framework presets add their own build artifact ignores, such as `.next`, `.output`, and `.tanstack`.

The React presets use ESLint React for JSX and React rules, plus the official `eslint-plugin-react-hooks` preset for hooks and React compiler rules.

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

| Config                                | Use for                            |
| ------------------------------------- | ---------------------------------- |
| `@blgc/config/typescript/base`        | Shared strict base settings        |
| `@blgc/config/typescript/library`     | Bundled libraries without DOM APIs |
| `@blgc/config/typescript/library-dom` | Libraries that use DOM globals     |
| `@blgc/config/typescript/node20`      | Node 20 packages and tools         |
| `@blgc/config/typescript/react`       | React packages and Vite apps       |
| `@blgc/config/typescript/next`        | Next.js apps                       |
| `@blgc/config/typescript/tanstack`    | TanStack apps                      |

Defaults to know: the base config uses ES2022, `module: preserve`, bundler module resolution, forced module detection, declarations, declaration maps, `skipLibCheck`, and strict type checking. TypeScript unused checks stay off because ESLint owns unused diagnostics.

Use `@blgc/config/typescript/library` when a package emits JavaScript through a bundler and uses TypeScript for declaration emit. Use `@blgc/config/typescript/node20` for Node packages or tools that emit JavaScript with `tsc`.

## Vitest

Merge the shared Vitest node config when you want the default test setup:

```js
import { nodeConfig } from '@blgc/config/vitest/node';
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

The node config sets the Node test environment, enables TypeScript path resolution, and uses text, JSON, and HTML coverage reporters.

## FAQ

### Do I need every peer tool installed?

No. Install the tools that your project runs. For example, a package that only extends TypeScript config does not need to run ESLint or Prettier.

### Can I override rules?

Yes. Add another config object after the shared config in `eslint.config.js`, add `compilerOptions` in `tsconfig.json`, or pass project-specific options to `mergeConfig` for Vitest.

### Why does ESLint report warnings instead of failing?

The shared ESLint config is a guideline first. Rule findings report as warnings so humans and agents can see what to improve without blocking local work.

Use `eslint --max-warnings=0` in CI or a package script when a project is ready to enforce a clean lint result.

### Why are the shared config files CommonJS?

CommonJS keeps the config package usable from both CommonJS and ESM project configs. ESM projects can import CommonJS presets, but CommonJS projects cannot synchronously `require()` ESM presets.

### Why does the React ESLint config use jiti?

`@eslint-react/eslint-plugin` is ESM-only. `jiti` lets the CommonJS ESLint presets load that plugin without forcing every consumer to migrate its `eslint.config.js` to ESM.

### Why does the library TypeScript config use module preserve?

Most Builder Group packages let Rollup or esbuild emit JavaScript and let TypeScript emit declarations. `module: preserve` keeps TypeScript's import resolution closer to what those bundlers see. Node packages that emit JavaScript with `tsc` should use the Node preset or override `compilerOptions.module`.

### Why not enable every strict TypeScript flag?

Flags like `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, and `erasableSyntaxOnly` are useful migration targets, but they require source-level cleanup or disallow current enum patterns. Enable them locally once a project is ready for that stricter contract.

### Why keep these configs in a package?

A package keeps defaults versioned, reviewable, and reusable. Projects can update one dependency instead of copying config changes by hand.

### Why only one Vitest preset?

The shared preset covers the common Node package tests. Browser tests, app plugins, and framework-specific Vite setup should stay local until multiple projects need the same preset.

## Credits

- [`turbo-basic`](https://github.com/vercel/turbo/tree/main/examples/basic): base configuration patterns from Vercel's starter template
- [`tsconfig/bases`](https://github.com/tsconfig/bases): TypeScript configuration references
