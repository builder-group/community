import type { Plugin } from 'rollup';
import { resolveTsPathsFactory, TResolveTsPathsFactoryOptions } from './resolve-ts-paths-factory';

export function typescriptPathsPlugin(options: TResolveTsPathsFactoryOptions = {}): Plugin {
	const resolveTsPaths = resolveTsPathsFactory(options);
	return {
		name: 'resolve-ts-paths',
		resolveId: resolveTsPaths
	};
}
