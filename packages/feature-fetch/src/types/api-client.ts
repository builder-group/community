import type { TParseAs } from './api';
import type { TFetchOptions, TFetchResponse } from './client';

// =============================================================================
// API Request
// =============================================================================

export type TApiGet = <
	GSucessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
>(
	path: string,
	options?: TFetchOptions<GParseAs>
) => Promise<TFetchResponse<GSucessResponseBody, GErrorResponseBody, GParseAs>>;

export type TApiPost = <
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GRequestBody extends RequestInit['body'] = any,
	GParseAs extends TParseAs = 'json'
>(
	path: string,
	body: GRequestBody,
	options?: TFetchOptions<GParseAs>
) => Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;

export type TApiPut = <
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GRequestBody extends RequestInit['body'] = any,
	GParseAs extends TParseAs = 'json'
>(
	path: string,
	body: GRequestBody,
	options?: TFetchOptions<GParseAs>
) => Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;

export type TApiDelete = <
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
>(
	path: string,
	options?: TFetchOptions<GParseAs>
) => Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;

// =============================================================================
// API Feature
// =============================================================================

export interface TApiFeature {
	get: TApiGet;
	put: TApiPut;
	post: TApiPost;
	del: TApiDelete;
}
