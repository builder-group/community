import { defineFeature, type TFeature } from 'feature-core';
import { hasHeader, normalizeHeaders } from '../lib';
import type { TFetchClientBase, TFetchLike, TFetchMiddleware } from '../types';

/** Adds an in-memory response cache middleware. Defaults to cacheable GET requests. */
export function cacheFeature(options: TCacheFeatureOptions = {}): TCacheFeature {
	return defineFeature<TCacheFeature>({
		key: 'cache',
		install(fetchClient: TFetchClientBase) {
			const cache = new ResponseCache();
			fetchClient._config.middleware.push(createResponseCacheMiddleware(cache, options));

			return {
				cache: {
					clear() {
						cache.clear();
					},
					invalidate(predicate: TCacheInvalidationPredicate) {
						cache.invalidate(predicate);
					}
				}
			};
		}
	});
}

export type TCacheFeature = TFeature<'cache', TCacheFeatureApi>;

export interface TCacheFeatureApi {
	/** Cache control methods for this installed feature. */
	cache: TCacheApi;
}

export interface TCacheApi {
	/** Clears all cached responses. */
	clear(): void;
	/** Deletes cached responses whose cache key matches `predicate`. */
	invalidate(predicate: TCacheInvalidationPredicate): void;
}

export type TCacheInvalidationPredicate = (key: string) => boolean;

// MARK: - Middleware

export function createCacheMiddleware(options: TCacheFeatureOptions = {}): TFetchMiddleware {
	return createResponseCacheMiddleware(new ResponseCache(), options);
}

function createResponseCacheMiddleware(
	cache: ResponseCache,
	options: TCacheFeatureOptions = {}
): TFetchMiddleware {
	const {
		maxAgeMs = 5 * 60 * 1000,
		getCacheKey = defaultGetCacheKey,
		shouldCache = defaultShouldCache
	} = options;

	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			const cacheKey = getCacheKey(url, requestInit);
			if (cacheKey != null) {
				const cachedResponse = cache.get(cacheKey);
				if (cachedResponse != null) {
					return cachedResponse;
				}
			}

			const response = await next(url, requestInit);
			if (cacheKey != null && shouldCache(response)) {
				const cacheMaxAgeMs = resolveCacheMaxAgeMs(response, maxAgeMs);
				if (cacheMaxAgeMs > 0) {
					cache.set(cacheKey, response, cacheMaxAgeMs);
				}
			}

			return response;
		};
}

export interface TCacheFeatureOptions {
	/** Maximum age in milliseconds. Defaults to 5 minutes. */
	maxAgeMs?: number;
	/** Returns the cache key for a request, or `null` to skip caching. Defaults to unauthenticated GET URLs. */
	getCacheKey?: TGetCacheKey;
	/** Returns whether a response should be cached. Defaults to OK responses without private cache directives. */
	shouldCache?: TShouldCache;
}

export type TGetCacheKey = (url: URL | string, init?: RequestInit) => string | null;

export type TShouldCache = (response: Response) => boolean;

const defaultGetCacheKey: TGetCacheKey = (url, init) => {
	const method = init?.method?.toUpperCase() ?? 'GET';
	if (method !== 'GET') {
		return null;
	}

	if (init?.cache === 'no-store' || init?.cache === 'reload') {
		return null;
	}

	const headers = normalizeHeaders(init?.headers);
	// Note: URL-only cache keys cannot safely separate user-specific responses
	if (hasHeader(headers, 'Authorization') || hasHeader(headers, 'Cookie')) {
		return null;
	}

	return `${method}:${url.toString()}`;
};

const defaultShouldCache: TShouldCache = (response) => {
	const cacheControl = response.headers.get('Cache-Control')?.toLowerCase() ?? '';
	const hasBlockedCacheDirective =
		cacheControl.includes('no-store') ||
		cacheControl.includes('no-cache') ||
		cacheControl.includes('private');
	return response.ok && !hasBlockedCacheDirective && !response.headers.has('Set-Cookie');
};

function resolveCacheMaxAgeMs(response: Response, maxAgeMs: number): number {
	const responseMaxAgeMs = getCacheControlMaxAgeMs(response.headers.get('Cache-Control'));
	if (responseMaxAgeMs == null) {
		return maxAgeMs;
	}

	return Math.min(maxAgeMs, responseMaxAgeMs);
}

function getCacheControlMaxAgeMs(cacheControl: string | null): number | null {
	const maxAge = cacheControl?.match(/(?:^|,)\s*max-age=(\d+)\s*(?:,|$)/i)?.[1];
	if (maxAge == null) {
		return null;
	}

	return Number(maxAge) * 1000;
}

// MARK: - Response Cache

class ResponseCache {
	private readonly entries = new Map<string, TCacheEntry>();

	set(key: string, response: Response, maxAgeMs: number): void {
		this.entries.set(key, {
			response: response.clone(),
			expiresAt: Date.now() + maxAgeMs
		});
	}

	get(key: string): Response | null {
		const entry = this.entries.get(key);
		if (entry != null && entry.expiresAt > Date.now()) {
			return entry.response.clone();
		}

		this.entries.delete(key);
		return null;
	}

	clear(): void {
		this.entries.clear();
	}

	invalidate(predicate: TCacheInvalidationPredicate): void {
		for (const key of this.entries.keys()) {
			if (predicate(key)) {
				this.entries.delete(key);
			}
		}
	}
}

interface TCacheEntry {
	response: Response;
	expiresAt: number;
}
