import { sleep } from '@ibg/utils';

import type { TBaseFetch, TEnforceFeatures, TFeatureKeys, TFetchClient } from '../types';

export function withRetries<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	options: { maxRetries?: number; retryCount?: number }
): TFetchClient<['retries', ...GSelectedFeatureKeys]> {
	fetchClient._features.push('retries');

	const { maxRetries = 3, retryCount = 0 } = options;

	const baseFetch = fetchClient._config.fetch;
	if (baseFetch != null) {
		fetchClient._config.fetch = (url, requestInit) =>
			fetchWithRetries(url, { requestInit, maxRetries, retryCount, fetch: baseFetch });
	}

	return fetchClient as TFetchClient<['retries', ...GSelectedFeatureKeys]>;
}

export async function fetchWithRetries(
	url: URL | string,
	config: TFetchWithRetriesConfig
): Promise<Response> {
	const { requestInit, maxRetries, retryCount, fetch: baseFetch } = config;
	try {
		// Send request
		const response = await fetch(url, requestInit);

		// If the rate limit error hits, retry
		if (response.status === 429 && maxRetries > 0) {
			await sleep(calculateRateLimitTimeout(response));
			return fetchWithRetries(url, {
				fetch: baseFetch,
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
				fetch: baseFetch,
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
	fetch: TBaseFetch;
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
