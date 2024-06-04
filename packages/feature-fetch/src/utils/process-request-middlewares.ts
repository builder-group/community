import type { TRequestMiddleware, TRequestMiddlewareData } from '../types';

export async function processRequestMiddlewares(
	middlewares: TRequestMiddleware[],
	data: TRequestMiddlewareData,
	middlewareProps: unknown
): Promise<TRequestMiddlewareData> {
	let result = data;

	// Apply middleware and merge results with existing data
	for (const middleware of middlewares) {
		const middlewareResult = await middleware({ ...result, props: middlewareProps });
		result = { ...result, ...middlewareResult };
	}

	return result;
}
