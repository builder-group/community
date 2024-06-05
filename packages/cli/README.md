# `@ibg/cli`
> Status: Experimental

A CLI tool for bundling TypeScript libraries with presets, powered by Rollup and Esbuild.

### Motivation
Eliminate the hassle of manual configuring Rollup by providing a flexible Rollup wrapper with preset configurations for Figma Plugin, Rust (Wasm), and Typescript library bundling. 

### Alternatives
- [tsup](https://github.com/egoist/tsup)

# 📖 Usage

## Bundle Files

To bundle your files, run:
```bash
ibg bundle
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

### Multiple Files

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

The `@ibg/cli` allows combining two Rollup configurations using plugin placeholders.

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
 * @type {import('@ibg/cli').TDynConfig}
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


