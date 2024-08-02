import { sleep } from '@blgc/utils';

import type {
	TEnforceFeatures,
	TFeatureKeys,
	TFetchClient,
	TFetchLike,
	TRequestMiddleware
} from '../types';

export function withRetry<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	options: TRetryMiddlewareOptions = {}
): TFetchClient<['retry', ...GSelectedFeatureKeys]> {
	fetchClient._features.push('retry');

	fetchClient._config.requestMiddlewares.push(createRetryMiddleware(options));

	return fetchClient as TFetchClient<['retry', ...GSelectedFeatureKeys]>;
}

export function createRetryMiddleware(options: TRetryMiddlewareOptions = {}): TRequestMiddleware {
	const { maxRetries = 3 } = options;
	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			return fetchWithRetries(url, { requestInit, maxRetries, retryCount: 0, fetchLike: next });
		};
}

interface TRetryMiddlewareOptions {
	maxRetries?: number;
}

async function fetchWithRetries(
	url: URL | string,
	config: TFetchWithRetriesConfig
): Promise<Response> {
	const { requestInit, maxRetries, retryCount, fetchLike } = config;
	try {
		// Send request
		const response = await fetchLike(url, requestInit);

		// If the rate limit error hits, retry
		if (response.status === 429 && maxRetries > 0) {
			await sleep(calculateRateLimitTimeout(response));
			return fetchWithRetries(url, {
				fetchLike,
				requestInit,
				maxRetries: maxRetries - 1,
				retryCount: retryCount + 1
			});
		}

		return response;
	} catch (error) {
		// If network error hits, retry based on exponential backoff strategy
		if (maxRetries > 0) {
			await sleep(calculateNetworkErrorTimeout(retryCount));
			return fetchWithRetries(url, {
				fetchLike,
				requestInit,
				maxRetries: maxRetries - 1,
				retryCount: retryCount + 1
			});
		}

		// If backoff strategy retries are exhausted, throw the network error
		throw error;
	}
}

interface TFetchWithRetriesConfig {
	fetchLike: TFetchLike;
	requestInit?: RequestInit;
	maxRetries: number;
	retryCount: number;
}

function calculateRateLimitTimeout(response: Response): number {
	const rateLimitReset = Number(response.headers.get('x-rate-limit-reset'));
	const rateLimitRemaining = Number(response.headers.get('x-rate-limit-remaining'));
	if (rateLimitRemaining === 0) {
		const timeTillReset = rateLimitReset * 1000 - Date.now();
		return timeTillReset;
	}
	return 0;
}

function calculateNetworkErrorTimeout(retries: number): number {
	return Math.pow(2, retries) * 1000; // Increase delay exponentially, starting with 1s
}
