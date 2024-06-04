import { sleep } from '@ibg/utils';

// TODO: Resolve retries with middleware! so make them optional
export async function fetchWithRetries(
	url: URL | string,
	options: {
		requestInit?: RequestInit;
		maxRetries?: number;
		retryCount?: number;
	} = {}
): Promise<Response> {
	const { requestInit, maxRetries = 3, retryCount = 0 } = options;
	try {
		// Send request
		const response = await fetch(url, requestInit);

		// If the rate limit error hits, retry
		if (response.status === 429 && maxRetries > 0) {
			await sleep(calculateRateLimitTimeout(response));
			return fetchWithRetries(url, {
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
				requestInit,
				maxRetries: maxRetries - 1,
				retryCount: retryCount + 1
			});
		}

		// If backoff strategy retries are exhausted, throw the network error
		throw error;
	}
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
