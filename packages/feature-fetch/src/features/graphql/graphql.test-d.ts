import { describe, expectTypeOf, it } from 'vitest';
import {
	createGraphQLFetchClient,
	type TGraphQLOperationOptions,
	type TTypedDocumentNode
} from './graphql';

describe('graphqlFeature function', () => {
	describe('variables', () => {
		it('should require variables from typed documents', () => {
			const client = createGraphQLFetchClient();

			void client.query(documentWithRequiredVariables, {
				variables: {
					id: 'user-1'
				}
			});
			void client.mutate(documentWithRequiredVariables, {
				variables: {
					id: 'user-1'
				}
			});
			void client.queryRaw(documentWithRequiredVariables, {
				variables: {
					id: 'user-1'
				}
			});
			void client.mutateRaw(documentWithRequiredVariables, {
				variables: {
					id: 'user-1'
				}
			});

			// @ts-expect-error variables are required by this typed document.
			void client.query(documentWithRequiredVariables);
		});

		it('should reject invalid variables from typed documents', () => {
			const client = createGraphQLFetchClient();

			void client.query(documentWithRequiredVariables, {
				// @ts-expect-error id is required inside variables.
				variables: {}
			});

			void client.query(documentWithRequiredVariables, {
				variables: {
					// @ts-expect-error id must be a string.
					id: 1
				}
			});
		});

		it('should keep optional variables optional', () => {
			const client = createGraphQLFetchClient();

			void client.query(documentWithOptionalVariables);
			void client.query(documentWithOptionalVariables, {
				variables: {}
			});
			void client.query(documentWithOptionalVariables, {
				variables: {
					id: 'user-1'
				}
			});
		});

		it('should keep string operations flexible unless variables are typed manually', () => {
			const client = createGraphQLFetchClient();

			void client.query<{ viewer: { id: string } }>('query Viewer { viewer { id } }');
			void client.query<{ user: { id: string } }, { id: string }>(
				'query GetUser($id: ID!) { user(id: $id) { id } }',
				{
					variables: {
						id: 'user-1'
					}
				}
			);

			// @ts-expect-error variables are required when the caller provides a variables type.
			void client.query<{ user: { id: string } }, { id: string }>(
				'query GetUser($id: ID!) { user(id: $id) { id } }'
			);
		});
	});

	describe('operation options', () => {
		it('should type variables from the options generic', () => {
			expectTypeOf<TGraphQLOperationOptions<{ id: string }>['variables']>().toEqualTypeOf<{
				id: string;
			}>();

			// @ts-expect-error variables are required by the options type.
			const options: TGraphQLOperationOptions<{ id: string }> = {};
			void options;
		});
	});

	describe('response inference', () => {
		it('should infer operation data from typed documents', async () => {
			const client = createGraphQLFetchClient();

			const result = await client.query(documentWithRequiredVariables, {
				variables: {
					id: 'user-1'
				}
			});
			if (result.isOk()) {
				expectTypeOf(result.value.data).toEqualTypeOf<{
					user: {
						id: string;
					};
				}>();
			}
		});

		it('should infer raw GraphQL response envelopes', async () => {
			const client = createGraphQLFetchClient();

			const result = await client.queryRaw(documentWithRequiredVariables, {
				variables: {
					id: 'user-1'
				}
			});
			if (result.isOk()) {
				expectTypeOf(result.value.data).toEqualTypeOf<
					| {
							user: {
								id: string;
							};
					  }
					| null
					| undefined
				>();
			}
		});
	});
});

declare const documentWithRequiredVariables: TTypedDocumentNode<
	{
		user: {
			id: string;
		};
	},
	{
		id: string;
	}
>;

declare const documentWithOptionalVariables: TTypedDocumentNode<
	{
		user: {
			id: string;
		};
	},
	{
		id?: string;
	}
>;
