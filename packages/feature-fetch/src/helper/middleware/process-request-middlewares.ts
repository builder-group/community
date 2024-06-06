import { type TFetchLike, type TRequestMiddleware } from '../../types';

export function processRequestMiddlewares(
	middlewares: TRequestMiddleware[],
	fetchLike: TFetchLike
): TFetchLike {
	return middlewares.reduceRight((acc, middleware) => middleware(acc), fetchLike);
}
