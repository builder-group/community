# rollup-plugin-ts-paths

Rollup plugin that resolves TypeScript `paths` and optional `baseUrl` imports with TypeScript's resolver. Use it when source files import aliases from `tsconfig.json` and Rollup needs concrete file paths before transform plugins run.

- Reads compiler options from `tsconfig.json` or inline overrides
- Resolves imports that match TypeScript `paths`
- Can resolve `baseUrl` imports that do not match a `paths` pattern
- Can return absolute paths or paths relative to the importing file
- Can map resolved `.d.ts` files back to matching `.js` or `.wasm` source files

## Example

```js
const { tsPathsPlugin } = require('rollup-presets');

module.exports = {
  input: './src/index.ts',
  plugins: [
    tsPathsPlugin({
      tsConfigPath: './tsconfig.json',
      resolveRelative: true
    })
  ]
};
```

## Options

| Option             | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `tsConfigPath`     | Path to the `tsconfig.json` file                                            |
| `compilerOptions`  | Compiler options merged after the config file                               |
| `resolveRelative`  | Return paths relative to the importer instead of absolute paths             |
| `allowNonRelative` | Resolve non-relative imports through `baseUrl` even without a `paths` match |
| `resolveDTsSource` | Resolve `.d.ts` files to matching `.js` or `.wasm` files when possible      |
| `transform`        | Final hook to rewrite the resolved id before Rollup receives it             |

The plugin ignores relative imports and virtual Rollup modules. It returns `null` when TypeScript cannot resolve the import.

## Credits

- [rollup-plugin-typescript-paths](https://github.com/simonhaenisch/rollup-plugin-typescript-paths)
- [tsc-alias](https://github.com/justkey007/tsc-alias)
