# Migration Guide

## 0.0.x to 0.1.0

`feature-logger` now uses the shared `.with(feature())` composition model from `feature-core`. The console-style logger methods remain, but feature setup, log levels, middleware, and log-id behavior changed.

### Replace `with*` Helpers With Features

Old helpers such as `withPrefix`, `withLogMethodPrefix`, `withStyle`, `withTimestamp`, and `withLogId` were removed.

Use feature factories with `.with(...)` instead:

```ts
import { createLogger, prefixFeature, timestampPrefixFeature } from 'feature-logger';

const logger = createLogger().with(prefixFeature('API'), timestampPrefixFeature());

logger.info('Request started');
```

Common replacements:

| Old helper                    | New feature                             |
| ----------------------------- | --------------------------------------- |
| `withPrefix(logger, value)`   | `logger.with(prefixFeature(value))`     |
| `withLogMethodPrefix(logger)` | `logger.with(logMethodPrefixFeature())` |
| `withStyle(logger, styles)`   | `logger.with(styleFeature(styles))`     |
| `withTimestamp(logger)`       | `logger.with(timestampPrefixFeature())` |
| `withLogId(logger)`           | `logger.with(logIdFeature())`           |

`isLoggerWithFeatures` was removed. Use `hasFeature` from `feature-core` when you need feature checks.

### Rename Log Levels

`LOG_LEVEL` was renamed to `ELogLevel`, and the numeric values changed.

```ts
// old
createLogger({ level: LOG_LEVEL.INFO });

// new
createLogger({ level: ELogLevel.INFO });
```

Avoid storing raw numeric levels. If you stored values such as `32` or `64`, replace them with enum names.

### Rename `middlewares` To `middleware`

The logger option is now singular:

```ts
// old
createLogger({ middlewares: [redactSecrets] });

// new
createLogger({ middleware: [redactSecrets] });
```

Old code using `{ middlewares: [...] }` will not install middleware.

### Update Middleware And Console Sinks

Middleware and custom console invocation now receive `(data, context)`.

```ts
import type { TLoggerMiddleware } from 'feature-logger';

const redactSecrets: TLoggerMiddleware = (data, context) => {
  if (context.logMethod === 'error') {
    return data.map((value) => (value === 'secret' ? '[redacted]' : value));
  }

  return data;
};
```

`context` includes `logMethod`, `level`, and the current middleware list.

If you implemented a custom `invokeConsole`, update it from `(logMethod, data)` to `(data, context)`.

### Update Log ID Usage

`logIdFeature()` no longer adds methods such as `logWithId` or `traceWithId`.

It overrides the normal log methods so they return the generated id:

```ts
const logger = createLogger().with(logIdFeature());

const logId = logger.info('Payment started');
```

The default id is now a 16-character hex string.

### Review Removed Or Renamed Types

- `TLogMethod` no longer includes `table`.
- `DEFAULT_STYLES` was renamed to `defaultLogStyles`.
- `TTimestampFeature` became `TTimestampPrefixFeature`.
- `TMethodPrefixFeature` became `TLogMethodPrefixFeature`.

Calling a log method with no arguments now forwards an empty data array instead of `[undefined]`.
