import { initGraphQLTada } from 'gql.tada';
import type { introspection } from './graphql-env';

export const gql = initGraphQLTada<{
	introspection: introspection;
}>();

export { readFragment } from 'gql.tada';
export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
