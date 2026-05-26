# rollup-plugin-ts-declarations

Rollup plugin that emits TypeScript declaration assets through the TypeScript compiler API. Use it when declaration output should be created inside a Rollup build instead of a separate `tsc --emitDeclarationOnly` command.

- Reads compiler options from `tsconfig.json` or inline overrides
- Forces declaration-only output into the Rollup output directory
- Removes JavaScript chunks from the declaration bundle
- Emits `.d.ts` and `.d.ts.map` files as Rollup assets
- Can warn, throw, or ignore TypeScript diagnostics

## Example

```js
const { tsDeclarationsPlugin } = require('rollup-presets');

module.exports = {
  input: './src/index.ts',
  output: {
    dir: './dist/types'
  },
  plugins: [
    tsDeclarationsPlugin({
      tsConfigPath: './tsconfig.json',
      diagnosticsLevel: 'warn'
    })
  ]
};
```

## Options

| Option             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `tsConfigPath`     | Path to the `tsconfig.json` file                                       |
| `compilerOptions`  | Compiler options merged after the config file                          |
| `diagnosticsLevel` | `error`, `warn`, or `ignore` for TypeScript diagnostics                |
| `extension`        | Extension replacement used in declaration filenames, defaults to `.ts` |
| `debug`            | Logs resolved compiler options and emitted file names                  |

`libraryPreset` defaults to `useTsc: true`, which runs `tsc --emitDeclarationOnly` outside Rollup. Use this plugin directly when you need declaration files to participate in a custom Rollup config.

## Credits

- [rollup-plugin-dts](https://github.com/Swatinem/rollup-plugin-dts)
