<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/rollup-presets/.github/banner.svg" alt="rollup-presets banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/rollup-presets">
        <img src="https://img.shields.io/bundlephobia/minzip/rollup-presets.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/rollup-presets">
        <img src="https://img.shields.io/npm/dt/rollup-presets.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`rollup-presets` is a Rollup config toolkit for TypeScript libraries. It reads bundle entry points from `package.json`, builds ESM and CJS outputs with esbuild, generates declaration files, resolves TypeScript paths, and leaves escape hatches for custom Rollup plugins.

- Build library outputs from `main`, `module`, `types`, `source`, or conditional `exports`
- Generate ESM, CJS, and TypeScript declaration outputs from one preset
- Keep package dependencies external by default
- Resolve `tsconfig` paths before transform plugins run
- Add custom plugins in predictable `pre`, `transform`, and `post` stages

```ts
// rollup.config.js
import { libraryPreset } from 'rollup-presets';

export default libraryPreset({
  formats: ['esm', 'cjs', 'types'],
  preserveModules: true
});
```

## Install

```bash
npm install -D rollup rollup-presets
```

## Usage

Add bundle paths to `package.json`:

```json
{
  "name": "my-library",
  "source": "./src/index.ts",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts"
}
```

Then create `rollup.config.js`:

```ts
import { libraryPreset } from 'rollup-presets';

export default libraryPreset();
```

The preset returns Rollup configs for the requested formats. By default it builds ESM, CJS, and declaration output.

## Package Exports

`libraryPreset` can also read conditional exports:

```json
{
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

For packages with multiple entry points, add one export per entry:

```json
{
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./react": {
      "source": "./src/react/index.ts",
      "import": "./dist/react/esm/index.js",
      "require": "./dist/react/cjs/index.js",
      "types": "./dist/react/types/index.d.ts"
    }
  }
}
```

When `preserveModules` is enabled, output paths are treated as directories and module structure is preserved under those directories.

## Library Preset

### `libraryPreset(options)`

Creates Rollup configs for TypeScript libraries.

```ts
import { libraryPreset } from 'rollup-presets';

export default libraryPreset({
  environment: 'production',
  formats: ['esm', 'cjs', 'types'],
  preserveModules: true,
  sourcemap: false,
  esbuildOptions: {
    target: 'es2020'
  }
});
```

| Option               | Default                                 | Description                                                   |
| -------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `environment`        | `process.env.NODE_ENV` or `development` | Controls production minification and default sourcemaps       |
| `formats`            | `['esm', 'cjs', 'types']`               | Output formats to create                                      |
| `preserveModules`    | `true`                                  | Preserve module structure in output                           |
| `sourcemap`          | `true` in development                   | Generate Rollup sourcemaps                                    |
| `useTsc`             | `true`                                  | Use `tsc --emitDeclarationOnly` for declarations              |
| `crossModuleImports` | `false`                                 | Rewrite internal package entry imports for multi-entry builds |
| `plugins`            | `{}`                                    | Extra Rollup plugins grouped by build stage                   |
| `esbuildOptions`     | `{}`                                    | Options passed to `rollup-plugin-esbuild`                     |
| `compilerOptions`    | `{}`                                    | TypeScript compiler option overrides                          |
| `onCreateConfig`     | `undefined`                             | Last chance to edit each generated Rollup config              |
| `debug`              | `false`                                 | Print resolved paths and declaration details                  |

## Plugin Stages

Use plugin stages to place custom behavior around the preset defaults:

```ts
import replace from '@rollup/plugin-replace';
import { libraryPreset } from 'rollup-presets';

export default libraryPreset({
  plugins: {
    pre: [
      replace({
        preventAssignment: true,
        values: { __DEV__: 'false' }
      })
    ],
    transform: [cssPlugin()],
    post: [analyzePlugin()]
  }
});
```

| Stage       | Runs before or after                          | Good for                             |
| ----------- | --------------------------------------------- | ------------------------------------ |
| `pre`       | Before externals, CommonJS, TS paths, esbuild | replacements, virtual modules, setup |
| `transform` | After TS path resolution, before esbuild      | CSS, assets, path-aware transforms   |
| `post`      | After esbuild                                 | analysis, compression, reporting     |

## Built-in Plugins

### `tsPathsPlugin(options)`

Resolves TypeScript `paths` and optional `baseUrl` imports through TypeScript's resolver.

```ts
import { tsPathsPlugin } from 'rollup-presets';

tsPathsPlugin({
  tsConfigPath: './tsconfig.json',
  resolveRelative: true
});
```

### `tsDeclarationsPlugin(options)`

Emits declaration files through the TypeScript compiler API. The library preset defaults to `useTsc: true`, which is usually more reliable for preserved module builds.

```ts
import { tsDeclarationsPlugin } from 'rollup-presets';

tsDeclarationsPlugin({
  tsConfigPath: './tsconfig.json',
  extension: '.d.ts'
});
```

### `createCrossModuleImportPlugin(options)`

Rewrites internal imports between package entry points when `crossModuleImports` is enabled in `libraryPreset`.

### `createRollupVirtualConfig(options)`

Creates a Rollup-compatible virtual config for build steps that are easier to run as code, such as calling `tsc`.

## FAQ

### Why does `libraryPreset` read from package.json?

Package metadata is already the contract users consume. Reading bundle paths from `package.json` keeps the published entry points and build outputs in sync.

### Why is `useTsc` enabled by default?

Declaration generation is more reliable with `tsc` when `preserveModules` is enabled, especially for packages with multiple entry points and internal cross-imports.

### When should I enable `crossModuleImports`?

Enable it for multi-entry packages where one exported entry imports another exported entry through a relative source path. Leave it off for single-entry libraries or packages without cross-entry imports.

### Can I still customize the generated Rollup config?

Yes. Use plugin stages for normal customization, or `onCreateConfig` when you need to edit each generated config directly.
