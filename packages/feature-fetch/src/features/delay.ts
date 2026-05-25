import { defineFeature, type TFeature } from 'feature-core';
import { sleep } from '../lib';
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
