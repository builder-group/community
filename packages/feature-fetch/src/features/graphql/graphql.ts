import type { DocumentNode } from '@0no-co/graphql.web';
import { defineFeature, type TFeature } from 'feature-core';
import { Err, Ok, type TResult } from 'tuple-result';
import { createFetchClient, type TCreateFetchClientOptions } from '../../create-fetch-client';
import type { FetchError } from '../../errors';
import type {
	TFetchClient,
	TFetchClientBase,
	TFetchOptions,
	TFetchResponse,
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
	return function graphQLOperationMethod(
		this: TFetchClientBase,
		document: TGraphQLDocumentInput,
		options: TGraphQLOperationOptions = {}
	) {
		return sendGraphQLRequest(this, document, options);
	} as TGraphQLOperationMethod;
}

function createGraphQLRawOperationMethod(): TGraphQLRawOperationMethod {
	return function graphQLRawOperationMethod(
		this: TFetchClientBase,
		document: TGraphQLDocumentInput,
		options: TGraphQLOperationOptions = {}
	) {
		return sendRawGraphQLRequest(this, document, options);
	} as TGraphQLRawOperationMethod;
}

export type TGraphQLOperationMethod = <
	GData extends object,
	GVariables extends object = Record<string, unknown>,
	GErrorResponseBody = unknown
>(
	document: TGraphQLDocumentInput<GData, GVariables>,
	...args: TGraphQLOperationOptionsArgs<GVariables>
) => Promise<TGraphQLOperationResponse<GData, GErrorResponseBody>>;

export type TGraphQLRawOperationMethod = <
	GData extends object,
	GVariables extends object = Record<string, unknown>,
	GErrorResponseBody = unknown
>(
	document: TGraphQLDocumentInput<GData, GVariables>,
	...args: TGraphQLOperationOptionsArgs<GVariables>
) => Promise<TFetchResponse<TGraphQLResponse<GData>, GErrorResponseBody, 'json'>>;

type TGraphQLOperationOptionsArgs<GVariables extends object> =
	TGraphQLHasRequiredVariables<GVariables> extends true
		? [options: TGraphQLOperationOptions<GVariables>]
		: [options?: TGraphQLOperationOptions<GVariables>];

export type TGraphQLOperationOptions<GVariables extends object = Record<string, unknown>> = Omit<
	TFetchOptions<'json'>,
	'body' | 'parseAs' | 'withResponse'
> &
	TGraphQLVariablesOption<GVariables>;

type TGraphQLVariablesOption<GVariables extends object> =
	TGraphQLHasRequiredVariables<GVariables> extends true
		? { variables: GVariables }
		: { variables?: GVariables };

type TGraphQLHasRequiredVariables<GVariables extends object> =
	TGraphQLRequiredVariableKeys<GVariables> extends never ? false : true;

type TGraphQLRequiredVariableKeys<GVariables extends object> = {
	[GKey in keyof GVariables]-?: Record<never, never> extends Pick<GVariables, GKey> ? never : GKey;
}[keyof GVariables];

// MARK: - Response

export type TGraphQLOperationResponse<GData, GErrorResponseBody = unknown> = TResult<
	TGraphQLOperationSuccess<GData>,
	TFetchResponseError<GErrorResponseBody>
>;

export interface TGraphQLOperationSuccess<GData> {
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

async function sendGraphQLRequest<
	GData extends object,
	GVariables extends object,
	GErrorResponseBody
>(
	client: TFetchClientBase,
	document: TGraphQLDocumentInput<GData, GVariables>,
	options: TGraphQLOperationOptions<GVariables>
): Promise<TGraphQLOperationResponse<GData, GErrorResponseBody>> {
	const [isGraphQLResponseOk, graphQLResponseErr, graphQLResponse] = await sendRawGraphQLRequest<
		GData,
		GVariables,
		GErrorResponseBody,
		true
	>(client, document, {
		...options,
		withResponse: true
	});
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

	return Ok({
		// Note: The caller provides the operation data type; this feature only maps the transport shape
		data: data as GData,
		extensions,
		response
	});
}

async function sendRawGraphQLRequest<
	GData extends object,
	GVariables extends object,
	GErrorResponseBody,
	GWithResponse extends boolean = false
>(
	client: TFetchClientBase,
	document: TGraphQLDocumentInput<GData, GVariables>,
	options: TGraphQLRequestOptions<GVariables, GWithResponse>
): Promise<TFetchResponse<TGraphQLResponse<GData>, GErrorResponseBody, 'json', GWithResponse>> {
	const { variables, ...fetchOptions } = options;
	const [isRequestBodyOk, requestBodyErr, requestBody] = await createGraphQLRequestBody(
		document,
		variables
	);
	if (!isRequestBodyOk) {
		return Err(requestBodyErr);
	}

	return client.request<TGraphQLResponse<GData>, GErrorResponseBody, 'json', GWithResponse>(
		'POST',
		'',
		{
			...fetchOptions,
			parseAs: 'json',
			body: requestBody
		}
	);
}

type TGraphQLRequestOptions<
	GVariables extends object,
	GWithResponse extends boolean
> = TGraphQLOperationOptions<GVariables> & {
	withResponse?: GWithResponse;
};

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
