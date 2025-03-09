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
        <img src="https://img.shields.io/npm/dt/featuer-state.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`rollup-presets` is a collection of opinionated, production-ready Rollup presets for building TypeScript libraries and applications.

- **Simple & Flexible**: Preconfigured yet highly customizable build presets
- **TypeScript-First**: Built-in TypeScript support with path aliases and declaration files
- **Multi-Format**: Supports ESM and CJS output with proper Node.js compatibility
- **Optimized**: Production-ready with minification and tree-shaking
- **Extensible**: Plugin system with four stages for maximum control

## 📖 Usage

```ts
// rollup.config.js
import { libraryPreset } from 'rollup-presets';

export default libraryPreset();
```

## 📙 Presets

### `libraryPreset()`

Creates a production-ready Rollup configuration for TypeScript libraries. Bundle paths are automatically resolved from your package.json exports field or standard fields.

#### 📖 Usage

First, configure your package.json to define the bundle paths. You can use either conditional exports (recommended) or standard fields:

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts",
      "source": "./src/index.ts"
    }
  }
}
```

Or using standard fields:

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "source": "./src/index.ts"
}
```

Then create your rollup.config.js:

```ts
import { libraryPreset } from 'rollup-presets';

export default libraryPreset();
```

That's it! This will automatically:
- Build ESM and CJS formats
- Generate TypeScript declarations
- Support path aliases from tsconfig.json
- Optimize for production by default

#### ⚙️ Configuration

```ts
libraryPreset({
  // Build environment
  environment: 'production',
  // Keep directory structure
  preserveModules: true,
  // Output formats to generate
  formats: ['esm', 'cjs'],
  // Plugin stages for maximum control
  plugins: {
    // Stage 1: Pre-processing
    // Perfect for file replacements, virtual modules, or environment setup
    pre: [replacePlugin()],
    
    // Stage 2: Path-aware Transformations
    // Runs after TypeScript paths are resolved
    // Perfect for CSS imports, asset handling, or any path-dependent plugins
    transform: [cssPlugin()],
    
    // Stage 3: Post-processing
    // Perfect for bundle analysis, compression, or final optimizations
    post: [analyzePlugin()]
  },
  // Customize esbuild options
  esbuildOptions: {
    target: 'es2020'
  },
  // Modify final config for each bundle
  onCreateConfig: (config, bundlePath) => config
});
```
