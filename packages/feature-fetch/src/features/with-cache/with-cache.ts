import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TRequestMiddleware
} from '../../types';
import { Cache, type TCacheOptions, type TGetCacheKey, type TShouldCache } from './Cache';

export function withCache<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	options: TCacheOptions = {}
): TFetchClient<['cache', ...GSelectedFeatureKeys]> {
	fetchClient._features.push('cache');
	fetchClient._config.requestMiddlewares.push(createCacheMiddleware(options));
	return fetchClient as TFetchClient<['cache', ...GSelectedFeatureKeys]>;
}

function createCacheMiddleware(options: TCacheOptions = {}): TRequestMiddleware {
	const {
		maxAge = 5 * 60 * 1000, // 5min
		getCacheKey = defaultGetCacheKey,
		shouldCache = defaultShouldCache
	} = options;
	const cache = new Cache();

	return (next) => async (url, init) => {
		const cacheKey = getCacheKey(url, init);
		if (cacheKey != null) {
			const cachedResponse = cache.get(cacheKey);
			if (cachedResponse != null) {
				return cachedResponse;
			}
		}

		const response = await next(url, init);
		if (cacheKey != null && shouldCache(response)) {
			cache.set(cacheKey, response, maxAge);
		}

		return response;
	};
}

const defaultGetCacheKey: TGetCacheKey = (url, init) => {
	if (init?.method !== 'GET') {
		return null;
	}
	return `${init.method}:${url.toString()}`;
};

const defaultShouldCache: TShouldCache = (response) => {
	return response.ok && response.status < 400;
};
