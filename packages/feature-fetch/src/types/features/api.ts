import { type TParseAs } from '../fetch';
import type { TFetchOptions, TFetchResponse, TUnserializedBody } from '../fetch-client';

export interface TApiFeature {
	get: TApiGet;
	put: TApiPut;
	post: TApiPost;
	del: TApiDelete;
}

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
	GRequestBody extends TUnserializedBody = Record<string, unknown>,
	GParseAs extends TParseAs = 'json'
>(
	path: string,
	body: GRequestBody,
	options?: TFetchOptions<GParseAs>
) => Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;

export type TApiPut = <
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GRequestBody extends TUnserializedBody = Record<string, unknown>,
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
