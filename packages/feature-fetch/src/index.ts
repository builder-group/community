export * from './create-fetch-client';
export * from './errors';
export * from './features';
export * from './lib';
export * from './types';

// Re-export the core tuple-result API for convenience
// Note: Keep these re-exports explicit. Wildcard re-exports prevent CommonJS static analysis from
// detecting named exports, which can cause Vite SSR errors such as `Named export 'Ok' not found`.
// https://nodejs.org/api/esm.html#commonjs-namespaces
export { Err, Ok } from 'tuple-result';
export type { TResult } from 'tuple-result';
