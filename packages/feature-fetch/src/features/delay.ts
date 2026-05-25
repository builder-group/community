import { defineFeature, type TFeature } from 'feature-core';
import type { TFetchClientBase, TFetchLike, TFetchMiddleware } from '../types';

/** Adds a request middleware that waits before forwarding each request. */
export function delayFeature(delayMs: number): TDelayFeature {
	return defineFeature<TDelayFeature>({
		key: 'delay',
		install(fetchClient: TFetchClientBase) {
			fetchClient._config.middleware.push(createDelayMiddleware(delayMs));

			return {};
		}
	});
}

export type TDelayFeature = TFeature<'delay', object>;

export function createDelayMiddleware(delayMs: number): TFetchMiddleware {
	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			await sleep(delayMs, requestInit?.signal);
			return next(url, requestInit);
		};
}

function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
	if (ms <= 0) {
		return Promise.resolve();
	}

	if (signal == null) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	if (signal.aborted) {
		return Promise.reject(getAbortReason(signal));
	}

	// Note: Capture the narrowed signal for callbacks that run after this scope
	const abortSignal = signal;
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			abortSignal.removeEventListener('abort', abort);
			resolve();
		}, ms);

		function abort(): void {
			clearTimeout(timeout);
			reject(getAbortReason(abortSignal));
		}

		abortSignal.addEventListener('abort', abort, { once: true });
	});
}

function getAbortReason(signal: AbortSignal): unknown {
	return signal.reason ?? new Error('The operation was aborted');
}
