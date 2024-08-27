import { type TParseAs } from '../fetch';
import type { TFetchOptions, TFetchResponse } from '../fetch-client';

export interface TGraphQLFeature {
	query: TGraphQLQuery;
}

export type TGraphQLQuery = <
	GVariables extends Record<string, any>,
	GSucessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
>(
	query: string,
	options: TFetchOptions<GParseAs> & { variables?: GVariables }
) => Promise<TFetchResponse<GSucessResponseBody, GErrorResponseBody, GParseAs>>;
