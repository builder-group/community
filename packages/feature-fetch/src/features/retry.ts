import { defineFeature, type TFeature } from 'feature-core';
import { getAbortReason, sleep } from '../lib';
import type { TFetchClientBase, TFetchLike, TFetchMiddleware } from '../types';

/** Adds retry behavior for network errors and retryable HTTP responses. */
export function retryFeature(options: TRetryFeatureOptions = {}): TRetryFeature {
	return defineFeature<TRetryFeature>({
		key: 'retry',
		install(fetchClient: TFetchClientBase) {
			fetchClient._config.middleware.push(createRetryMiddleware(options));

			return {};
		}
	});
}

export type TRetryFeature = TFeature<'retry', object>;

export function createRetryMiddleware(options: TRetryFeatureOptions = {}): TFetchMiddleware {
	const {
		maxRetries = 3,
		networkError: { baseDelayMs = 1000, maxDelayMs = 30_000 } = {},
		shouldRetryResponse = defaultShouldRetryResponse
	} = options;
	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			return fetchWithRetries(url, requestInit, {
				fetchLike: next,
				maxRetries,
				networkError: {
					baseDelayMs,
					maxDelayMs
				},
				shouldRetryResponse
			});
		};
}

export interface TRetryFeatureOptions {
	/** Number of retries after the initial request. Defaults to `3`. */
	maxRetries?: number;
	/** Network-error exponential backoff options. */
	networkError?: TRetryNetworkErrorOptions;
	/** Response retry predicate. Defaults to HTTP 429 responses. */
	shouldRetryResponse?: TShouldRetryResponse;
}

export interface TRetryNetworkErrorOptions {
	/** Base delay in milliseconds. Defaults to `1000`. */
	baseDelayMs?: number;
	/** Maximum delay in milliseconds. Defaults to `30000`. */
	maxDelayMs?: number;
}

/** Returns whether an HTTP response should be retried. `attemptIndex` is zero for the initial request. */
export type TShouldRetryResponse = (response: Response, attemptIndex: number) => boolean;

async function fetchWithRetries(
	url: URL | string,
	requestInit: RequestInit | undefined,
	config: TFetchWithRetriesConfig
): Promise<Response> {
	const { fetchLike, maxRetries, networkError, shouldRetryResponse } = config;

	for (let attemptIndex = 0; ; attemptIndex++) {
		if (requestInit?.signal?.aborted === true) {
			throw getAbortReason(requestInit.signal);
		}

		let response: Response;
		try {
			response = await fetchLike(url, requestInit);
		} catch (error) {
			const canRetry = attemptIndex < maxRetries;
			if (!canRetry) {
				throw error;
			}

			await sleep(calculateNetworkErrorDelayMs(attemptIndex, networkError), requestInit?.signal);
			continue;
		}

		const canRetry = attemptIndex < maxRetries;
		const canRetryResponse = canRetry && shouldRetryResponse(response, attemptIndex);
		if (!canRetryResponse) {
			return response;
		}

		const responseRetryDelayMs = calculateResponseRetryDelayMs(response);
		await cancelResponseBody(response);
		await sleep(responseRetryDelayMs, requestInit?.signal);
	}
}

interface TFetchWithRetriesConfig {
	fetchLike: TFetchLike;
	maxRetries: number;
	networkError: TResolvedRetryNetworkErrorConfig;
	shouldRetryResponse: TShouldRetryResponse;
}

interface TResolvedRetryNetworkErrorConfig {
	baseDelayMs: number;
	maxDelayMs: number;
}

function calculateNetworkErrorDelayMs(
	attemptIndex: number,
	networkError: TResolvedRetryNetworkErrorConfig
): number {
	const baseDelayMs = Math.max(0, networkError.baseDelayMs);
	const maxDelayMs = Math.max(0, networkError.maxDelayMs);
	const delayMs = Math.pow(2, attemptIndex) * baseDelayMs;
	return Math.min(delayMs, maxDelayMs);
}

function calculateResponseRetryDelayMs(response: Response): number {
	const retryAfterDelayMs = getRetryAfterDelayMs(response.headers.get('Retry-After'));
	if (retryAfterDelayMs != null) {
		return retryAfterDelayMs;
	}

	const rateLimitRemaining = response.headers.get('x-rate-limit-remaining');
	if (rateLimitRemaining !== '0') {
		return 0;
	}

	const rateLimitReset = Number(response.headers.get('x-rate-limit-reset'));
	if (!Number.isFinite(rateLimitReset)) {
		return 0;
	}

	// Note: x-rate-limit-reset is commonly a Unix timestamp in seconds, but the header is non-standard
	return Math.max(0, rateLimitReset * 1000 - Date.now());
}

function getRetryAfterDelayMs(retryAfter: string | null): number | null {
	const value = retryAfter?.trim();
	if (!value) {
		return null;
	}

	const seconds = Number(value);
	if (Number.isFinite(seconds) && seconds >= 0) {
		return seconds * 1000;
	}

	const retryAtMs = Date.parse(value);
	if (!Number.isFinite(retryAtMs)) {
		return null;
	}

	return Math.max(0, retryAtMs - Date.now());
}

function defaultShouldRetryResponse(response: Response): boolean {
	return response.status === 429;
}

async function cancelResponseBody(response: Response): Promise<void> {
	try {
		await response.body?.cancel();
	} catch {
		// Note: Body cleanup should not hide the original retry decision
	}
}
