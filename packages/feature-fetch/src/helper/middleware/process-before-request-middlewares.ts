import type { TBeforeRequestMiddleware, TBeforeRequestMiddlewareData } from '../../types';

export async function processBeforeRequestMiddlewares(
	middlewares: TBeforeRequestMiddleware[],
	data: TBeforeRequestMiddlewareData,
	middlewareProps: unknown
): Promise<TBeforeRequestMiddlewareData> {
	let result = data;

	// Apply middleware and merge results with existing data
	for (const middleware of middlewares) {
		const middlewareResult = await middleware({ ...result, props: middlewareProps });
		result = { ...result, ...middlewareResult };
	}

	return result;
}
