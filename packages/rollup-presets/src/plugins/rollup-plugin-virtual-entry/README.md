# rollup-plugin-virtual-entry

Small Rollup plugin that provides an empty virtual entry module. It is used by `createRollupVirtualConfig()` for build steps that need Rollup lifecycle hooks but do not need a real source entry file.

- Resolves the internal empty entry id
- Loads that id as `export {}`
- Keeps helper configs independent from package source files

## Example

```js
const { createRollupVirtualConfig } = require('rollup-presets');

module.exports = createRollupVirtualConfig({
  name: 'run-task',
  async execute() {
    await runTask();
  }
});
```

Use `createRollupVirtualConfig()` for most cases. Reach for `virtualEntryPlugin()` only when building a custom Rollup config that needs the same empty virtual input.
