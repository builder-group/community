import { type TOpenApiRouter } from './types';

export function createOpenApiRouter<GPaths extends object = object>(): TOpenApiRouter<
	['base'],
	GPaths
> {
	return {
		_: null,
		_features: ['base']
	};
}
