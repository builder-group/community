<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/cli/.github/banner.svg" alt="@blgc/cli banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@blgc/cli">
        <img src="https://img.shields.io/npm/dt/@blgc/cli.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`@blgc/cli` is a straightforward CLI tool for bundling TypeScript libraries with presets, powered by Rollup and Esbuild.

### 🌟 Motivation

Eliminate the hassle of manually configuring Rollup over and over by providing a flexible wrapper with preset configurations for Figma plugins, Rust (Wasm), and TypeScript library bundling.

### ⚖️ Alternatives

- [tsup](https://github.com/egoist/tsup)

## 📖 Usage

### Bundle Files

To bundle your files, run:

```bash
blgc bundle
```

Define the source file and output locations in `package.json`:

```json
{
	"source": "./src/index.ts",
	"main": "./dist/cjs/index.js",
	"module": "./dist/esm/index.js",
	"types": "./dist/types/index.d.ts"
}
```

Output:

- `dist/esm`: ESM bundle
- `dist/cjs`: CommonJS bundle
- `dist/types`: TypeScript types

### Bundle multiple Files

To bundle multiple files, use the `exports` field:

```json
{
	"exports": {
		"./package1": {
			"source": "./src/index.ts",
			"main": "./dist/package1/cjs/index.js",
			"module": "./dist/package1/esm/index.js",
			"types": "./dist/package1/types/index.d.ts"
		}
	}
}
```

Output:

- `dist/package1/esm`: ESM bundle
- `dist/package1/cjs`: CommonJS bundle
- `dist/package1/types`: TypeScript types

### Custom Configuration

Expand the preset configuration via a `dyn.config.js` file.

#### Add Rollup plugins

The `@blgc/cli` allows combining two Rollup configurations using plugin placeholders.

- **`override`** (`isBase = false`): Fill placeholders in `overrideConfig` with plugins from `baseConfig`.

  ```javascript
  // Base Configuration (rollup.config.base.js)
  export default {
    plugins: [nodeExternals(), commonjs(), 'import-css', typescriptPaths(), esbuild()]
  };

  // Override Configuration (rollup.config.js)
  export default {
    plugins: [css()]
  };

  // Result
  plugins: [nodeExternals(), commonjs(), css(), typescriptPaths(), esbuild()];
  ```

- **`base`** (`isBase = true`): Fill placeholders in `baseConfig` with plugins from `overrideConfig`.

  ```javascript
  // Base Configuration (rollup.config.base.js)
  export default {
    plugins: [nodeExternals(), commonjs(), 'import-css', typescriptPaths(), esbuild()]
  };

  // Override Configuration (rollup.config.js)
  export default {
    plugins: ['node-externals', 'commonjs', css(), 'resolve-typescript-paths', 'esbuild']
  };

  // Result
  plugins: [nodeExternals(), commonjs(), css(), typescriptPaths(), esbuild()];
  ```

In the below example we expand the preset library Rollup config with the `rollup-plugin-preserve-directives` plugin.

```js
/**
 * @type {import('@blgc/cli').TDynConfig}
 */
module.exports = {
	library: {
		rollupConfig: {
			isBase: false,
			options: {
				plugins: [preserveDirectives()]
			}
		}
	}
};
```
