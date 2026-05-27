import { initGraphQLTada } from 'gql.tada';
import type { introspection } from './gen/countries-env';

export const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: {
		ID: string;
	};
}>();
