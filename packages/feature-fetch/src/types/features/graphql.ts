import { type DocumentNode } from '@0no-co/graphql.web';
import { type TParseAs } from '../fetch';
import type { TFetchOptions, TFetchResponse } from '../fetch-client';

export interface TGraphQLFeature {
	key: 'graphql';
	api: {
		query: TGraphQLQuery;
	};
}

export type TGraphQLQuery = <
	GSucessResponseBody extends Record<string, any>,
	GVariables extends Record<string, any>,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
>(
	query: TDocumentInput<GSucessResponseBody, GVariables>,
	options: TFetchOptions<GParseAs> & { variables?: GVariables }
) => Promise<TFetchResponse<GSucessResponseBody, GErrorResponseBody, GParseAs>>;

/**
 * Any GraphQL `DocumentNode` or query string input.
 */
// Based on: https://github.com/urql-graphql/urql/blob/main/packages/core/src/types.ts
export type TDocumentInput<GResult = Record<string, any>, GVariables = Record<string, any>> =
	| string
	| DocumentNode
	| TTypedDocumentNode<GResult, GVariables>;

/**
 * A GraphQL `DocumentNode` with attached generics for its result data and variables.
 *
 * @remarks
 * A GraphQL {@link DocumentNode} defines both the variables it accepts on request and the `data`
 * shape it delivers on a response in the GraphQL query language.
 *
 * To bridge the gap to TypeScript, tools may be used to generate TypeScript types that define the shape
 * of `data` and `variables` ahead of time. These types are then attached to GraphQL documents using this
 * `TypedDocumentNode` type.
 *
 * @privateRemarks
 * For compatibility reasons this type has been copied and internalized from:
 * https://github.com/dotansimha/graphql-typed-document-node/blob/3711b12/packages/core/src/index.ts#L3-L10
 */
// Based on: https://github.com/urql-graphql/urql/blob/main/packages/core/src/types.ts
export type TTypedDocumentNode<
	GResult = Record<string, any>,
	GVariables = Record<string, any>
> = DocumentNode & {
	/** Type to support `@graphql-typed-document-node/core`
	 * @internal
	 */
	__apiType?: (variables: GVariables) => GResult;
	/** Type to support `TypedQueryDocumentNode` from `graphql`
	 * @internal
	 */
	__ensureTypesOfVariablesAndResultMatching?: (variables: GVariables) => GResult;
};
