# `@ibg/cli`

## > `ibg bundle`

### Auto-reading `exports` in `package.json` for Bundling

The `@ibg/cli` bundler can automatically interpret the exports field in your `package.json` to deduce appropriate input and output paths for bundling.

#### Recognized `exports` Formats

1. **Object-based Mappings (Nested Conditions or Subpaths)**:

   - Specify exports for specific conditions or subpaths.
     ```json
     {
     	"exports": {
     		"package1": {
     			"import": "./feature.mjs",
     			"require": "./feature.cjs"
     		}
     	}
     }
     ```

2. **Top-level Fields**:
   - The bundler will automatically consider `source`, `main`, and `module` fields if no specific export conditions are found.
     ```json
     {
     	"source": "./src/index.ts",
     	"main": "./dist/cjs/index.js",
     	"module": "./dist/esm/index.js"
     }
     ```

#### Recommendations

- **TypeScript Source**: If you're using TypeScript, ensure you specify the main TypeScript file in the `source` field.
- **Entry Points**: The bundler primarily looks at the `main` and `module` fields for determining the entry points for CommonJS and ES Module formats, respectively.
- **Explicit Paths**: While the bundler tries its best to auto-determine paths, for the most predictable results, ensure that you specify the input and output paths explicitly.

### **Merging Rollup Configurations with Placeholders**

The `@ibg/cli` bundler offers a unique way to combine two Rollup configurations. By designating plugin placeholders in one configuration, you can replace them with actual plugin instances from a secondary configuration. This flexibility allows you to deftly adjust the plugin order or replace plugins without restructuring your entire setup.

The merging behavior is by default `base` but you can change it with the `--pluginTemplate` option:

#### **1. Using `--pluginTemplate=override`**

Here, the `overrideConfig` acts as the template. Its placeholders are filled by plugins from `baseConfig`.

**Base Configuration (`rollup.config.base.ts`):**

```javascript
export default {
	plugins: [
		nodeExternals(),
		commonjs(),
		'import-css', // Ignored if 'override'
		typescriptPaths(),
		esbuild()
	]
};
```

**Override Configuration (`rollup.config.js`):**

```javascript
export default {
	plugins: ['node-externals', 'commonjs', css(), 'resolve-typescript-paths', 'esbuild']
};
```

**Merged Configuration (using `--pluginTemplate=override`):**

```javascript
plugins: [nodeExternals(), commonjs(), css(), typescriptPaths(), esbuild()];
```

#### **2. Using `--pluginTemplate=base`**

In this scenario, the `baseConfig` is the template. Its placeholders are filled with plugins from the `overrideConfig`.

**Base Configuration (`rollup.config.base.ts`):**

```javascript
export default {
	plugins: [nodeExternals(), commonjs(), 'import-css', typescriptPaths(), esbuild()]
};
```

**Override Configuration (`rollup.config.js`):**

```javascript
export default {
	plugins: [css()]
};
```

**Merged Configuration (using `--pluginTemplate=base`):**

```javascript
plugins: [nodeExternals(), commonjs(), css(), typescriptPaths(), esbuild()];
```
