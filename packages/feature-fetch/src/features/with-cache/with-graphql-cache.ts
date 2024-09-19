import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TRequestMiddleware
} from '../../types';
import { Cache } from './Cache';

export function withGraphQLCache<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base', 'graphql']>>
): TFetchClient<['graphqlCache', ...GSelectedFeatureKeys]> {
	fetchClient._features.push('graphqlCache');
	fetchClient._config.requestMiddlewares.push(createGraphQLCacheMiddleware());
	return fetchClient as TFetchClient<['graphqlCache', ...GSelectedFeatureKeys]>;
}

function createGraphQLCacheMiddleware(): TRequestMiddleware {
	const graphqlCache = new Cache<TCacheKey>();

	return (next) => async (url, init) => {
		if (init?.method !== 'POST' || init.body == null) {
			return next(url, init);
		}

		let body: { query?: string; variables?: Record<string, unknown> };
		try {
			body = JSON.parse(init.body as string);
		} catch {
			return next(url, init);
		}

		if (body.query == null || body.variables == null) {
			return next(url, init);
		}

		const cacheKey: TCacheKey = body as TCacheKey;

		if (body.query.trim().startsWith('mutation')) {
			const response = await next(url, init);
			const result = (await response.clone().json()) as TGraphQLResponse;

			// Invalidate cache based on affected types
			if (result.data != null) {
				const typenames = collectTypenames(result.data);
				graphqlCache.invalidate((key) => {
					return typenames.some((typename) => key.query.includes(typename));
				});
			}

			return response;
		}

		const cachedResponse = graphqlCache.get(cacheKey);
		if (cachedResponse != null) {
			return cachedResponse;
		}

		const response = await next(url, init);
		graphqlCache.set(cacheKey, response);

		return response;
	};
}

function collectTypenames(data: Record<string, unknown>): string[] {
	const typenames: string[] = [];

	function traverse(obj: unknown): void {
		if (Array.isArray(obj)) {
			obj.forEach(traverse);
		} else if (obj != null && typeof obj === 'object') {
			if ('__typename' in obj && typeof obj.__typename === 'string') {
				typenames.push(obj.__typename);
			}
			Object.values(obj).forEach(traverse);
		}
	}

	traverse(data);
	return typenames;
}

interface TGraphQLResponse {
	data?: Record<string, unknown>;
	errors?: { message: string }[];
}

interface TCacheKey {
	query: string;
	variables: Record<string, unknown>;
}
