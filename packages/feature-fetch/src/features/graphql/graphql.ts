import type { DocumentNode } from '@0no-co/graphql.web';
import { defineFeature, type TFeature } from 'feature-core';
import { Err, Ok, type TResult } from 'tuple-result';
import { createFetchClient, type TCreateFetchClientOptions } from '../../create-fetch-client';
import type { FetchError } from '../../errors';
import type {
	TFetchClient,
	TFetchClientBase,
	TFetchOptions,
	TFetchRequestResponse,
	TFetchResponseError
} from '../../types';
import { getOperationString } from './get-operation-string';
import { GraphQLError } from './GraphQLError';

/** Creates a fetch client with `graphqlFeature()` installed. Set `baseUrl` to the full GraphQL endpoint URL. */
export function createGraphQLFetchClient(
	options: TCreateFetchClientOptions = {}
): TFetchClient<[TGraphQLFeature]> {
	return createFetchClient(options).with(graphqlFeature());
}

// MARK: - Feature

/** Adds GraphQL POST helpers for queries and mutations. */
export function graphqlFeature(): TGraphQLFeature {
	return defineFeature<TGraphQLFeature>({
		key: 'graphql',
		install() {
			return {
				query: createGraphQLOperationMethod(),
				queryRaw: createGraphQLRawOperationMethod(),
				mutate: createGraphQLOperationMethod(),
				mutateRaw: createGraphQLRawOperationMethod()
			};
		}
	});
}

export type TGraphQLFeature = TFeature<'graphql', TGraphQLFeatureApi>;

export interface TGraphQLFeatureApi {
	query: TGraphQLOperationMethod;
	queryRaw: TGraphQLRawOperationMethod;
	mutate: TGraphQLOperationMethod;
	mutateRaw: TGraphQLRawOperationMethod;
}

// MARK: - Operation

function createGraphQLOperationMethod(): TGraphQLOperationMethod {
	return async function graphQLOperationMethod(
		this: TFetchClientBase,
		document: TGraphQLDocumentInput,
		options: TGraphQLOperationMethodOptions = {}
	) {
		const { withResponse = false, ...requestOptions } = options;
		const [isGraphQLResponseOk, graphQLResponseErr, graphQLResponse] = await sendGraphQLHttpRequest(
			this,
			document,
			requestOptions
		);
		if (!isGraphQLResponseOk) {
			return Err(graphQLResponseErr);
		}

		const {
			data: { data, errors, extensions },
			response
		} = graphQLResponse;

		if (Array.isArray(errors) && errors.length > 0) {
			return Err(
				new GraphQLError(errors, {
					data,
					extensions,
					response
				})
			);
		}

		return Ok(
			withResponse
				? {
						data,
						extensions,
						response
					}
				: data
		);
	} as TGraphQLOperationMethod;
}

type TGraphQLOperationMethodOptions<GVariables extends object = Record<string, unknown>> =
	TGraphQLOperationOptions<GVariables> & {
		withResponse?: boolean;
	};

function createGraphQLRawOperationMethod(): TGraphQLRawOperationMethod {
	return async function graphQLRawOperationMethod(
		this: TFetchClientBase,
		document: TGraphQLDocumentInput,
		options: TGraphQLOperationOptions = {}
	) {
		const [isGraphQLResponseOk, graphQLResponseErr, graphQLResponse] = await sendGraphQLHttpRequest(
			this,
			document,
			options
		);
		if (!isGraphQLResponseOk) {
			return Err(graphQLResponseErr);
		}

		return Ok(graphQLResponse.data);
	} as TGraphQLRawOperationMethod;
}

export interface TGraphQLOperationMethod {
	<
		GData extends object,
		GVariables extends object = Record<string, unknown>,
		GErrorResponseBody = unknown
	>(
		document: TGraphQLDocumentInput<GData, GVariables>,
		...args: TGraphQLOperationOptionsArgs<
			TGraphQLOperationOptions<GVariables> & { withResponse: true }
		>
	): Promise<TGraphQLOperationResponse<GData, GErrorResponseBody, true>>;
	<
		GData extends object,
		GVariables extends object = Record<string, unknown>,
		GErrorResponseBody = unknown
	>(
		document: TGraphQLDocumentInput<GData, GVariables>,
		...args: TGraphQLOperationOptionsArgs<
			TGraphQLOperationOptions<GVariables> & { withResponse?: false }
		>
	): Promise<TGraphQLOperationResponse<GData, GErrorResponseBody>>;
	<
		GData extends object,
		GVariables extends object = Record<string, unknown>,
		GErrorResponseBody = unknown,
		GWithResponse extends boolean = boolean
	>(
		document: TGraphQLDocumentInput<GData, GVariables>,
		...args: TGraphQLOperationOptionsArgs<
			TGraphQLOperationOptions<GVariables> & { withResponse?: GWithResponse }
		>
	): Promise<TGraphQLOperationResponse<GData, GErrorResponseBody, GWithResponse>>;
}

export type TGraphQLRawOperationMethod = <
	GData extends object,
	GVariables extends object = Record<string, unknown>,
	GErrorResponseBody = unknown
>(
	document: TGraphQLDocumentInput<GData, GVariables>,
	...args: TGraphQLOperationOptionsArgs<TGraphQLOperationOptions<GVariables>>
) => Promise<TGraphQLRawOperationResponse<GData, GErrorResponseBody>>;

type TGraphQLOperationOptionsArgs<GOptions extends object> =
	TRequiredKeys<GOptions> extends never ? [options?: GOptions] : [options: GOptions];

export type TGraphQLOperationOptions<GVariables extends object = Record<string, unknown>> = Omit<
	TFetchOptions<'json'>,
	'body' | 'parseAs'
> &
	TGraphQLVariablesOption<GVariables>;

type TGraphQLVariablesOption<GVariables extends object> =
	TGraphQLHasRequiredVariables<GVariables> extends true
		? { variables: GVariables }
		: { variables?: GVariables };

type TGraphQLHasRequiredVariables<GVariables extends object> =
	TRequiredKeys<GVariables> extends never ? false : true;

type TRequiredKeys<GObject extends object> = {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Required-key detection needs the canonical `{}` assignability check
	[GKey in keyof GObject]-?: {} extends Pick<GObject, GKey> ? never : GKey;
}[keyof GObject];

// MARK: - Response

export type TGraphQLOperationResponse<
	GData,
	GErrorResponseBody = unknown,
	GWithResponse extends boolean = false
> = TResult<
	GWithResponse extends true ? TGraphQLOperationResponseDetails<GData> : GData,
	TFetchResponseError<GErrorResponseBody>
>;

export type TGraphQLRawOperationResponse<GData, GErrorResponseBody = unknown> = TResult<
	TGraphQLResponse<GData>,
	TFetchResponseError<GErrorResponseBody>
>;

export interface TGraphQLOperationResponseDetails<GData> {
	data: GData;
	extensions?: Record<string, unknown>;
	response: Response;
}

/**
 * Standard GraphQL response structure.
 *
 * @see https://spec.graphql.org/September2025/#sec-Response
 */
export interface TGraphQLResponse<GData = unknown> {
	data?: GData | null;
	errors?: TGraphQLError[];
	extensions?: Record<string, unknown>;
}

/**
 * Standard GraphQL error structure.
 *
 * @see https://spec.graphql.org/September2025/#sec-Errors
 */
export interface TGraphQLError {
	message: string;
	locations?: Array<{
		line: number;
		column: number;
	}>;
	path?: Array<string | number>;
	extensions?: Record<string, unknown>;
}

// MARK: - Document

/** Any GraphQL `DocumentNode` or operation string input. */
export type TGraphQLDocumentInput<GResult = object, GVariables = Record<string, unknown>> =
	| string
	| DocumentNode
	| TTypedDocumentNode<GResult, GVariables>;

/** GraphQL document with result and variables types, compatible with `gql.tada` and typed-document-node. */
export type TTypedDocumentNode<
	GResult = object,
	GVariables = Record<string, unknown>
> = DocumentNode & {
	/** @internal Type to support `@graphql-typed-document-node/core`. */
	__apiType?: (variables: GVariables) => GResult;
	/** @internal Type to support `TypedQueryDocumentNode` from `graphql`. */
	__ensureTypesOfVariablesAndResultMatching?: (variables: GVariables) => GResult;
};

async function sendGraphQLHttpRequest<
	GData extends object,
	GVariables extends object,
	GErrorResponseBody
>(
	client: TFetchClientBase,
	document: TGraphQLDocumentInput<GData, GVariables>,
	options: TGraphQLOperationOptions<GVariables>
): Promise<TFetchRequestResponse<TGraphQLResponse<GData>, GErrorResponseBody, 'json'>> {
	const { variables, ...fetchOptions } = options;
	const [isRequestBodyOk, requestBodyErr, requestBody] = await createGraphQLRequestBody(
		document,
		variables
	);
	if (!isRequestBodyOk) {
		return Err(requestBodyErr);
	}

	return client.request<TGraphQLResponse<GData>, GErrorResponseBody, 'json'>('POST', '', {
		...fetchOptions,
		parseAs: 'json',
		body: requestBody
	});
}

async function createGraphQLRequestBody<GData extends object, GVariables extends object>(
	document: TGraphQLDocumentInput<GData, GVariables>,
	variables: GVariables | undefined
): Promise<TResult<TGraphQLRequestBody<GVariables>, FetchError>> {
	const [isOperationStringOk, operationStringErr, operationString] =
		await getOperationString(document);
	if (!isOperationStringOk) {
		return Err(operationStringErr);
	}

	if (variables === undefined) {
		return Ok({
			query: operationString
		});
	}

	return Ok({
		query: operationString,
		variables
	});
}

interface TGraphQLRequestBody<GVariables extends object> {
	query: string;
	variables?: GVariables;
}
