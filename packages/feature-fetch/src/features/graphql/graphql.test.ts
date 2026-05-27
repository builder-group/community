import { parse } from '@0no-co/graphql.web';
import { unwrapErr } from 'tuple-result';
import { describe, expect, it, vi } from 'vitest';
import type { TFetchLike } from '../../types';
import { createGraphQLFetchClient, type TTypedDocumentNode } from './graphql';
import { GraphQLError } from './GraphQLError';

describe('graphqlFeature function', () => {
	describe('query method', () => {
		it('should post GraphQL queries and return operation data', async () => {
			// Prepare
			const { client, fetchLike, getRequestBody } = createTestGraphQLClient({
				data: {
					user: {
						id: 'user-1'
					}
				}
			});

			// Act
			const result = await client.query<{ user: { id: string } }, { id: string }>(
				'query GetUser($id: ID!) { user(id: $id) { id } }',
				{
					variables: {
						id: 'user-1'
					}
				}
			);

			// Assert
			expect(result.unwrap()).toEqual({
				user: {
					id: 'user-1'
				}
			});
			expect(getRequestBody()).toEqual({
				query: 'query GetUser($id: ID!) { user(id: $id) { id } }',
				variables: {
					id: 'user-1'
				}
			});
			expect(fetchLike).toHaveBeenCalledWith(
				'https://api.example.com/graphql',
				expect.objectContaining({
					method: 'POST'
				})
			);
		});

		it('should post typed document inputs', async () => {
			// Prepare
			const { client } = createTestGraphQLClient({
				data: {
					user: {
						id: 'user-1'
					}
				}
			});
			const document = parse(`
				query GetUser($id: ID!) {
					user(id: $id) {
						id
					}
				}
			`) as TTypedDocumentNode<{ user: { id: string } }, { id: string }>;

			// Act
			const result = await client.query(document, {
				variables: {
					id: 'user-1'
				}
			});

			// Assert
			expect(result.unwrap()).toEqual({
				user: {
					id: 'user-1'
				}
			});
		});

		it('should map GraphQL errors to GraphQLError', async () => {
			// Prepare
			const { client } = createTestGraphQLClient({
				data: null,
				errors: [
					{
						message: 'User not found'
					}
				]
			});

			// Act
			const result = await client.query<{ user: { id: string } }>('query GetUser { user { id } }');

			// Assert
			expect(result.isErr()).toBe(true);
			expect(unwrapErr(result)).toBeInstanceOf(GraphQLError);
		});

		it('should omit variables when none are passed', async () => {
			// Prepare
			const { client, getRequestBody } = createTestGraphQLClient({
				data: {
					viewer: {
						id: 'user-1'
					}
				}
			});

			// Act
			const result = await client.query<{ viewer: { id: string } }>(
				'query Viewer { viewer { id } }'
			);

			// Assert
			expect(result.isOk()).toBe(true);
			expect(getRequestBody()).toEqual({
				query: 'query Viewer { viewer { id } }'
			});
		});

		it('should include extensions and response when requested', async () => {
			// Prepare
			const { client } = createTestGraphQLClient({
				data: {
					user: {
						id: 'user-1'
					}
				},
				extensions: {
					traceId: 'trace-1'
				}
			});

			// Act
			const result = await client.query<{ user: { id: string } }>('query GetUser { user { id } }', {
				withResponse: true
			});
			const value = result.unwrap();

			// Assert
			expect(value.data).toEqual({
				user: {
					id: 'user-1'
				}
			});
			expect(value.extensions).toEqual({
				traceId: 'trace-1'
			});
			expect(value.response).toBeInstanceOf(Response);
		});
	});

	describe('mutate method', () => {
		it('should post GraphQL mutations with variables', async () => {
			// Prepare
			const { client, getRequestBody } = createTestGraphQLClient({
				data: {
					updateUser: {
						id: 'user-1'
					}
				}
			});

			// Act
			const result = await client.mutate<{ updateUser: { id: string } }, { id: string }>(
				'mutation UpdateUser($id: ID!) { updateUser(id: $id) { id } }',
				{
					variables: {
						id: 'user-1'
					}
				}
			);

			// Assert
			expect(result.unwrap()).toEqual({
				updateUser: {
					id: 'user-1'
				}
			});
			expect(getRequestBody()).toEqual({
				query: 'mutation UpdateUser($id: ID!) { updateUser(id: $id) { id } }',
				variables: {
					id: 'user-1'
				}
			});
		});
	});

	describe('queryRaw method', () => {
		it('should return the raw GraphQL response body', async () => {
			// Prepare
			const responseBody = {
				data: null,
				errors: [
					{
						message: 'User not found'
					}
				]
			};
			const { client } = createTestGraphQLClient(responseBody);

			// Act
			const result = await client.queryRaw<{ user: { id: string } }>(
				'query GetUser { user { id } }'
			);

			// Assert
			expect(result.unwrap()).toEqual(responseBody);
		});
	});

	describe('mutateRaw method', () => {
		it('should return the raw GraphQL mutation response body', async () => {
			// Prepare
			const responseBody = {
				data: {
					updateUser: {
						id: 'user-1'
					}
				}
			};
			const { client } = createTestGraphQLClient(responseBody);

			// Act
			const result = await client.mutateRaw<{ updateUser: { id: string } }>(
				'mutation UpdateUser { updateUser { id } }'
			);

			// Assert
			expect(result.unwrap()).toEqual(responseBody);
		});
	});
});

function createTestGraphQLClient(responseBody: unknown): TTestGraphQLClient {
	let requestBody: unknown;
	const fetchLike = vi.fn<TFetchLike>(async (_url, requestInit) => {
		requestBody = JSON.parse(String(requestInit?.body));
		return Response.json(responseBody);
	});

	return {
		client: createGraphQLFetchClient({
			fetch: fetchLike,
			baseUrl: 'https://api.example.com/graphql'
		}),
		fetchLike,
		getRequestBody: () => requestBody
	};
}

interface TTestGraphQLClient {
	client: ReturnType<typeof createGraphQLFetchClient>;
	fetchLike: ReturnType<typeof vi.fn<TFetchLike>>;
	getRequestBody: () => unknown;
}
